/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface StringWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function StringWidget({ ref, store, appearance }: StringWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=StringWidget.d.ts.map