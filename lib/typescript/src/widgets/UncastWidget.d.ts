/**
 * UncastWidget — fallback for uncast/unsupported/unknown DataType (REQ-16).
 *
 * Displays raw string value if available. Does not crash.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface UncastWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function UncastWidget({ ref, store }: UncastWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=UncastWidget.d.ts.map