/**
 * DateWidget — renders a date entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with YYYY-MM-DD mask/validation.
 *
 * Value shape (ts-rosa codecs.ts:153-158, AnswerValue.ts:27):
 *   date value = Date object (UTC midnight for the given date).
 *   store.answerQuestion receives a Date directly.
 *
 * Variants (ADR-3 date):
 *   default    → full YYYY-MM-DD TextInput
 *   month-year → MM-YYYY entry (P1: same TextInput, placeholder adapted)
 *   year       → YYYY entry (P1: same TextInput, placeholder adapted)
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface DateWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function DateWidget({ ref, store, appearance }: DateWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=DateWidget.d.ts.map