/**
 * pickWidget — dispatch (dataType, controlType, appearance) → { Widget, variant } (ADR-5).
 *
 * PR-3a: string, int, decimal, long, boolean, NoteWidget, UncastWidget.
 * PR-3b: selectOne, selectMulti, date, time, dateTime, RangeWidget (controlType=range).
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
import { SelectOneWidget } from './SelectOneWidget';
import { SelectMultiWidget } from './SelectMultiWidget';
import { DateWidget } from './DateWidget';
import { TimeWidget } from './TimeWidget';
import { DateTimeWidget } from './DateTimeWidget';
import { RangeWidget } from './RangeWidget';
import { ImageWidget } from './ImageWidget';
import { AudioWidget } from './AudioWidget';
import { VideoWidget } from './VideoWidget';
import { SignatureWidget } from './SignatureWidget';
import { FileWidget } from './FileWidget';
import { GeoPointWidget } from './GeoPointWidget';
import { GeoShapeWidget } from './GeoShapeWidget';
import { GeoTraceWidget } from './GeoTraceWidget';
import { BarcodeWidget } from './BarcodeWidget';

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
  readonly?: boolean,
  mediatype?: string | null
): PickWidgetResult {
  // 1. range controlType → RangeWidget (PR-3b)
  if (controlType === 'range') {
    return {
      Widget: RangeWidget,
      variant: resolveVariant(dataType, controlType, appearance),
    };
  }

  // 2. Binary routing — must run BEFORE the dataType switch (M17-M19)
  if (dataType === 'binary') {
    const tokens = appearance != null ? appearance.toLowerCase().trim().split(/\s+/) : [];
    if (tokens.includes('draw') || tokens.includes('signature')) {
      return { Widget: SignatureWidget, variant: 'signature' };
    }
    if (tokens.includes('barcode')) {
      return { Widget: BarcodeWidget, variant: 'default' };
    }
    if (mediatype === 'image/*') {
      return { Widget: ImageWidget, variant: 'default' };
    }
    if (mediatype === 'audio/*') {
      return { Widget: AudioWidget, variant: 'default' };
    }
    if (mediatype === 'video/*') {
      return { Widget: VideoWidget, variant: 'default' };
    }
    return { Widget: FileWidget, variant: 'default' };
  }

  // 3. Note detection — must run BEFORE the dataType switch
  if (
    dataType === 'string' &&
    controlType === 'input' &&
    (readonly ||
      (appearance != null &&
        appearance.toLowerCase().trim().split(/\s+/).includes('note')))
  ) {
    return { Widget: NoteWidget, variant: 'default' };
  }

  switch (dataType) {
    case 'string':
      return {
        Widget: StringWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'int':
      return {
        Widget: IntWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'decimal':
      return {
        Widget: DecimalWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'long':
      return {
        Widget: LongWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'boolean':
      return {
        Widget: BooleanWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'uncast':
    case 'unsupported':
      return { Widget: UncastWidget, variant: 'default' };

    case 'selectOne':
      return {
        Widget: SelectOneWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'selectMulti':
      return {
        Widget: SelectMultiWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'date':
      return {
        Widget: DateWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'time':
      return {
        Widget: TimeWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'dateTime':
      return {
        Widget: DateTimeWidget,
        variant: resolveVariant(dataType, controlType, appearance),
      };

    case 'geopoint':
      return {
        Widget: GeoPointWidget,
        variant: 'default',
      };

    case 'geoshape':
      return {
        Widget: GeoShapeWidget,
        variant: 'default',
      };

    case 'geotrace':
      return {
        Widget: GeoTraceWidget,
        variant: 'default',
      };

    default:
      // Unknown dataType — UncastWidget per ADR-5 rule 4
      return { Widget: UncastWidget, variant: 'default' };
  }
}
