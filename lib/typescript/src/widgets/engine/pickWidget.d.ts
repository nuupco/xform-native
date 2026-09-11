/**
 * pickWidget — dispatch (dataType, controlType, appearance) → { Widget, variant } (ADR-5).
 *
 * PR-3a: string, int, decimal, long, boolean, NoteWidget, UncastWidget.
 * PR-3b: selectOne, selectMulti, date, time, dateTime, RangeWidget (controlType=range).
 */
import type { DataType } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
import type React from 'react';
import { type VariantId } from './appearance.js';
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
export declare function pickWidget(dataType: DataType, controlType: ControlType, appearance: string | null | undefined, readonly?: boolean, mediatype?: string | null): PickWidgetResult;
//# sourceMappingURL=pickWidget.d.ts.map