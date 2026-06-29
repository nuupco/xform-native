/**
 * IntWidget — integer input (REQ-13).
 *
 * Parses input to integer via parseInt. NaN → does not call answerQuestion.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface IntWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function IntWidget({ ref, store, appearance }: IntWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=IntWidget.d.ts.map