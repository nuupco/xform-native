/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti):
 *   default  → checkbox list (Pressable per option)
 *   minimal  → bottom-sheet (P1 falls back to default; P2 can add sheet)
 *   others   → fall back to default (P1)
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface SelectMultiWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function SelectMultiWidget({ ref, store, appearance }: SelectMultiWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=SelectMultiWidget.d.ts.map