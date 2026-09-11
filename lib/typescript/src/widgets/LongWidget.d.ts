/**
 * LongWidget — long integer input (REQ-13).
 *
 * Uses parseFloat for the committed value (JavaScript has no 64-bit int;
 * long is a large number — decision 3, no BigInt rework in this change).
 * The draft parse predicate stays integer-shaped (no decimal points),
 * matching Int, even though the committed value is produced via parseFloat.
 * Draft-vs-committed-store separation delegated to useDraftValue.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface LongWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function LongWidget({ nodeRef, store, appearance }: LongWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=LongWidget.d.ts.map