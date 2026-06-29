/**
 * DecimalWidget — decimal (float) input (REQ-13).
 *
 * Parses input via parseFloat.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface DecimalWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function DecimalWidget({ ref, store, appearance }: DecimalWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=DecimalWidget.d.ts.map