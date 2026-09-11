/**
 * NoteWidget — read-only display of note text (REQ-15), with optional label
 * media (image/audio/video).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(nodeRef). Renders nothing at all when
 * that value is empty AND the label carries no usable media — an empty
 * note (e.g. a readonly/calculated field whose expression hasn't resolved
 * to anything yet) with no media has no information to show, so it
 * shouldn't reserve visual space or leak an empty box.
 *
 * Label media (getLabelMediaUri, same mechanism as SelectOneWidget's
 * image-map variant): a note's label can carry a `jr://` itext media
 * reference for 'image', 'audio', or 'video'. store.mediaResolver (a
 * host-provisioned, opt-in seam) resolves that raw reference to a
 * loadable URI. Falls back to text-only (or nothing) when mediaResolver
 * is absent, no form carries media, or resolution fails — same silent
 * fallback principle as image-map/map.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface NoteWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function NoteWidget({ nodeRef, store }: NoteWidgetProps): import("react").JSX.Element | null;
//# sourceMappingURL=NoteWidget.d.ts.map