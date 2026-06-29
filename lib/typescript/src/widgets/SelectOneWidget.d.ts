/**
 * SelectOneWidget — renders a single-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:180-183, AnswerValue.ts:30):
 *   selectOne value = string (a single choice token).
 *   store.answerQuestion receives the token string directly.
 *
 * Variants (ADR-3 selectOne):
 *   default  → radio-style list (Pressable per option)
 *   minimal  → bottom-sheet dropdown (BottomSheet primitive)
 *   likert / autocomplete / columns / columns-pack / quick → fall back to default (P1)
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface SelectOneWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function SelectOneWidget({ ref, store, appearance }: SelectOneWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=SelectOneWidget.d.ts.map