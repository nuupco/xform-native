/**
 * TimeWidget — renders a time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with HH:MM validation.
 *
 * Value shape (ts-rosa v0.7.4 codecs.ts, AnswerValue.ts):
 *   time value = Date object anchored to epoch (1970-01-01) + optional
 *   `.offset` (raw UTC offset string the answer was captured with).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: HH:MM using the OFFSET THE ANSWER WAS CAPTURED WITH (product
 * decision — odd/tasks/time-offset-awareness.md), not the device's current
 * offset. `store.adapter.getAnswerOffset(nodeRef)` surfaces that stored
 * offset; `undefined`/`"Z"` (legacy/offset-less data) falls back to plain
 * UTC getters, identical to the pre-existing behavior.
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