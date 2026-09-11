/**
 * DecimalWidget — decimal (float) input (REQ-13).
 *
 * Parses input via parseFloat. Draft-vs-committed-store separation
 * delegated to useDraftValue (widget-draft-value); trailing "." / lone
 * "-" are held as an uncommitted draft rather than truncated or rejected.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface DecimalWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function DecimalWidget({ nodeRef, store, appearance }: DecimalWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=DecimalWidget.d.ts.map