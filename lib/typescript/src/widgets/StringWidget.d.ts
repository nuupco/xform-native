/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url | masked
 *
 * `masked` obscures input as it's typed (RN's `secureTextEntry`, same as ODK
 * Collect's password-style InputType transformation). Per ODK Collect's
 * Appearances.isMasked(), 'numbers' always wins when both tokens are present
 * — see appearance.ts's resolveVariant.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface StringWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function StringWidget({ nodeRef, store, appearance }: StringWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=StringWidget.d.ts.map