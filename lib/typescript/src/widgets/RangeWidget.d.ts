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
 *   no-ticks  → same as default in P1
 *   picker    → same as default in P1
 *   vertical  → same as default in P1
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface RangeWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
    /** Range start bound (inclusive). Defaults to 0 when absent. */
    start?: number;
    /** Range end bound (inclusive). Defaults to 10 when absent. */
    end?: number;
    /** Step increment. Defaults to 1 when absent. */
    step?: number;
}
export declare function RangeWidget({ ref, store, appearance, start, end, step, }: RangeWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=RangeWidget.d.ts.map