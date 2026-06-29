/**
 * NoteWidget — read-only display of note text (REQ-15).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(ref).
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface NoteWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function NoteWidget({ ref, store }: NoteWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=NoteWidget.d.ts.map