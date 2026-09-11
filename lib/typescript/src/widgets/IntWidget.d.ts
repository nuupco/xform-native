/**
 * IntWidget — integer input (REQ-13).
 *
 * Draft-vs-committed-store separation delegated to useDraftValue
 * (widget-draft-value). Parse predicate rejects decimal points and lone
 * `-` rather than truncating/rejecting silently.
 *
 * `bearing` variant is gated on expo-sensors' Magnetometer (optional peer
 * dep, same lazy-require gating pattern as expo-camera/expo-image-picker —
 * see ImageWidget/VideoWidget). When absent, falls back to the plain
 * numeric TextInput — never crashes.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface IntWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function IntWidget({ nodeRef, store, appearance }: IntWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=IntWidget.d.ts.map