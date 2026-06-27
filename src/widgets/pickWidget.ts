/**
 * pickWidget — dispatch (dataType, controlType, appearance) → { Widget, variant } (ADR-5).
 *
 * PR-3a covers: string, int, decimal, long, boolean, NoteWidget, UncastWidget.
 * PR-3b deferred types (selectOne, selectMulti, date, time, dateTime, range)
 * route to UnsupportedWidget — clearly marked TODO, does NOT crash.
 */

import type { DataType } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
import type React from 'react';
import { resolveVariant, type VariantId } from './appearance';
import { StringWidget } from './StringWidget';
import { IntWidget } from './IntWidget';
import { DecimalWidget } from './DecimalWidget';
import { LongWidget } from './LongWidget';
import { BooleanWidget } from './BooleanWidget';
import { NoteWidget } from './NoteWidget';
import { UncastWidget } from './UncastWidget';
import { UnsupportedWidget } from './UnsupportedWidget';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetComponent = React.ComponentType<any>;

export interface PickWidgetResult {
  Widget: WidgetComponent;
  variant: VariantId;
}

/**
 * Dispatch a (dataType, controlType, appearance) triple to a widget component + variant.
 *
 * Order of precedence (ADR-5):
 *   1. controlType === 'range'  → TODO PR-3b: UnsupportedWidget
 *   2. controlType === 'secret' → StringWidget (secret variant via resolveVariant — treat as string)
 *   3. Note detection: string + input + appearance includes 'note' → NoteWidget
 *   4. By dataType: string, int, decimal, long, boolean → their widgets
 *   5. uncast | unsupported → UncastWidget
 *   6. PR-3b deferred (selectOne, selectMulti, date, time, dateTime) → UnsupportedWidget TODO
 *   7. Anything else (unknown dataType) → UncastWidget
 */
export function pickWidget(
  dataType: DataType,
  controlType: ControlType,
  appearance: string | null | undefined,
): PickWidgetResult {
  // 1. range controlType → TODO PR-3b
  if (controlType === 'range') {
    // TODO PR-3b: wire RangeWidget here
    return { Widget: UnsupportedWidget, variant: 'default' };
  }

  // 3. Note detection — must run BEFORE the dataType switch
  if (
    dataType === 'string' &&
    controlType === 'input' &&
    appearance != null &&
    appearance.toLowerCase().trim().split(/\s+/).includes('note')
  ) {
    return { Widget: NoteWidget, variant: 'default' };
  }

  switch (dataType) {
    case 'string':
      return { Widget: StringWidget, variant: resolveVariant(dataType, controlType, appearance) };

    case 'int':
      return { Widget: IntWidget, variant: resolveVariant(dataType, controlType, appearance) };

    case 'decimal':
      return { Widget: DecimalWidget, variant: resolveVariant(dataType, controlType, appearance) };

    case 'long':
      return { Widget: LongWidget, variant: resolveVariant(dataType, controlType, appearance) };

    case 'boolean':
      return { Widget: BooleanWidget, variant: resolveVariant(dataType, controlType, appearance) };

    case 'uncast':
    case 'unsupported':
      return { Widget: UncastWidget, variant: 'default' };

    // PR-3b deferred — TODO: wire dedicated widgets in PR-3b
    case 'date':
    case 'time':
    case 'dateTime':
    case 'selectOne':
    case 'selectMulti':
      // TODO PR-3b: replace with DateWidget / TimeWidget / DateTimeWidget / SelectOneWidget / SelectMultiWidget
      return { Widget: UnsupportedWidget, variant: 'default' };

    default:
      // Unknown dataType — UncastWidget per ADR-5 rule 4
      return { Widget: UncastWidget, variant: 'default' };
  }
}
