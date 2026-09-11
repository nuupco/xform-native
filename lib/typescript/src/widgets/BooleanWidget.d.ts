/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * ODK Collect has no boolean appearance variants — always the same control.
 * default → SegmentedButton (Sí/No), replaces the native `Switch` (design
 *   decision 5): `Switch` is native-rendered (only tintable, not M3-shaped)
 *   and its ~30dp thumb fails the glove-use target. `testID="boolean-switch"`
 *   is preserved on the container as a compatibility contract.
 *
 * Unanswered state maps to SegmentedButton's `value: null`, so it is visually
 * distinct from an explicit "No" — neither segment renders as selected.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface BooleanWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function BooleanWidget({ nodeRef, store }: BooleanWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=BooleanWidget.d.ts.map