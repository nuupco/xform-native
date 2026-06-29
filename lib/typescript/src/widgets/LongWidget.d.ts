/**
 * LongWidget — long integer input (REQ-13).
 *
 * Uses parseFloat (JavaScript has no 64-bit int; long is a large number).
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface LongWidgetProps {
    ref: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function LongWidget({ ref, store, appearance }: LongWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=LongWidget.d.ts.map