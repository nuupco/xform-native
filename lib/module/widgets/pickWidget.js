"use strict";

/**
 * pickWidget — dispatch (dataType, controlType, appearance) → { Widget, variant } (ADR-5).
 *
 * PR-3a: string, int, decimal, long, boolean, NoteWidget, UncastWidget.
 * PR-3b: selectOne, selectMulti, date, time, dateTime, RangeWidget (controlType=range).
 */

import { resolveVariant } from "./appearance.js";
import { StringWidget } from "./StringWidget.js";
import { IntWidget } from "./IntWidget.js";
import { DecimalWidget } from "./DecimalWidget.js";
import { LongWidget } from "./LongWidget.js";
import { BooleanWidget } from "./BooleanWidget.js";
import { NoteWidget } from "./NoteWidget.js";
import { UncastWidget } from "./UncastWidget.js";
import { SelectOneWidget } from "./SelectOneWidget.js";
import { SelectMultiWidget } from "./SelectMultiWidget.js";
import { DateWidget } from "./DateWidget.js";
import { TimeWidget } from "./TimeWidget.js";
import { DateTimeWidget } from "./DateTimeWidget.js";
import { RangeWidget } from "./RangeWidget.js";
import { ImageWidget } from "./ImageWidget.js";
import { AudioWidget } from "./AudioWidget.js";
import { SignatureWidget } from "./SignatureWidget.js";
import { FileWidget } from "./FileWidget.js";
import { UnsupportedWidget } from "./UnsupportedWidget.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

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
export function pickWidget(dataType, controlType, appearance, readonly, mediatype) {
  // 1. range controlType → RangeWidget (PR-3b)
  if (controlType === 'range') {
    return {
      Widget: RangeWidget,
      variant: resolveVariant(dataType, controlType, appearance)
    };
  }

  // 2. Binary routing — must run BEFORE the dataType switch (M17-M19)
  if (dataType === 'binary') {
    const tokens = appearance != null ? appearance.toLowerCase().trim().split(/\s+/) : [];
    if (tokens.includes('draw') || tokens.includes('signature')) {
      return {
        Widget: SignatureWidget,
        variant: 'signature'
      };
    }
    if (mediatype === 'image/*') {
      return {
        Widget: ImageWidget,
        variant: 'default'
      };
    }
    if (mediatype === 'audio/*') {
      return {
        Widget: AudioWidget,
        variant: 'default'
      };
    }
    if (mediatype === 'video/*') {
      return {
        Widget: UnsupportedWidget,
        variant: 'default'
      };
    }
    return {
      Widget: FileWidget,
      variant: 'default'
    };
  }

  // 3. Note detection — must run BEFORE the dataType switch
  if (dataType === 'string' && controlType === 'input' && (readonly || appearance != null && appearance.toLowerCase().trim().split(/\s+/).includes('note'))) {
    return {
      Widget: NoteWidget,
      variant: 'default'
    };
  }
  switch (dataType) {
    case 'string':
      return {
        Widget: StringWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'int':
      return {
        Widget: IntWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'decimal':
      return {
        Widget: DecimalWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'long':
      return {
        Widget: LongWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'boolean':
      return {
        Widget: BooleanWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'uncast':
    case 'unsupported':
      return {
        Widget: UncastWidget,
        variant: 'default'
      };
    case 'selectOne':
      return {
        Widget: SelectOneWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'selectMulti':
      return {
        Widget: SelectMultiWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'date':
      return {
        Widget: DateWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'time':
      return {
        Widget: TimeWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    case 'dateTime':
      return {
        Widget: DateTimeWidget,
        variant: resolveVariant(dataType, controlType, appearance)
      };
    default:
      // Unknown dataType — UncastWidget per ADR-5 rule 4
      return {
        Widget: UncastWidget,
        variant: 'default'
      };
  }
}
//# sourceMappingURL=pickWidget.js.map