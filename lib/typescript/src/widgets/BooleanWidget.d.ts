/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * Variants (ADR-3):
 *   default → Switch
 *   checkbox → Pressable checkbox (custom, no native module)
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface BooleanWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function BooleanWidget({ ref, store, appearance }: BooleanWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=BooleanWidget.d.ts.map