/**
 * TimeWidget — renders a time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with HH:MM validation.
 *
 * Value shape (ts-rosa codecs.ts:162-169, AnswerValue.ts:28):
 *   time value = Date object anchored to epoch (1970-01-01).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: HH:MM (UTC hours/minutes from the Date value).
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface TimeWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function TimeWidget({ nodeRef, store, appearance: _appearance }: TimeWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=TimeWidget.d.ts.map