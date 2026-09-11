/**
 * RangeWidget — renders a range/numeric stepper (REQ-13, controlType=range).
 *
 * RN-core only — no @react-native-community/slider (ZERO native deps constraint).
 * Implemented as a stepper (decrement/value display/increment) using Pressable + Text.
 *
 * Range bounds (start/end/step): ts-rosa FormElement (FormElement.ts) has NO dedicated
 * range bound fields on the FormElement union — the 'question' kind carries only
 * controlType, binding, choices, appearance, etc. Range bounds are NOT accessible via
 * ts-rosa at the FormElement level. Resolution strategy:
 *   - Accept start/end/step as optional props (caller passes them from the XForm definition
 *     when available, e.g. parsed from the raw body element attributes).
 *   - Sane defaults: start=0, end=10, step=1 when props are absent.
 *   - This is documented as a P2 improvement: expose range bounds through FormElement/adapter.
 *
 * Value shape: numeric (number). ts-rosa range uses underlying int/decimal dataType.
 *   store.answerQuestion receives the number directly.
 *
 * Variants (ADR-3 controlType:range):
 *   default   → horizontal stepper (−  value  +)
 *   no-ticks  → stepper without value text display
 *   picker    → BottomSheet picker with scrollable list of values
 *   vertical  → vertical stepper layout
 *   rating    → row of 1..N touch-to-select stars, N = end - start + 1
 *               (falls back to 5 stars when start/end are absent, matching
 *               this widget's existing start=0/end=10 default-prop story)
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface RangeWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
    /** Range start bound (inclusive). Defaults to 0 when absent. */
    start?: number;
    /** Range end bound (inclusive). Defaults to 10 when absent. */
    end?: number;
    /** Step increment. Defaults to 1 when absent. */
    step?: number;
}
export declare function RangeWidget({ nodeRef, store, appearance, start: startProp, end: endProp, step, }: RangeWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=RangeWidget.d.ts.map