/**
 * DateTimeWidget — renders a date+time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with YYYY-MM-DDTHH:MM validation.
 *
 * Value shape (ts-rosa codecs.ts:172-176, AnswerValue.ts:29):
 *   dateTime value = Date object (full ISO 8601 timestamp).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: YYYY-MM-DDTHH:MM (UTC).
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface DateTimeWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function DateTimeWidget({ nodeRef, store, appearance: _appearance }: DateTimeWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=DateTimeWidget.d.ts.map