/**
 * RankWidget — reorder control for controlType 'rank'.
 *
 * Value shape: same order-preserving `string[]` codec as SelectMultiWidget
 * (dataType 'selectMulti'). Display order is a pure function of the store,
 * derived fresh on every render — no local ordering state, no useEffect
 * (rank-widget-support ADR-B1). `store.answerQuestion` is called ONLY from
 * the reorder handler, never on mount.
 *
 * Spec (Rank Widget requirement): position number in a `primaryContainer`
 * circle (left), item text (center), grip icon as the drag handle (right).
 * While a row is being lifted: elevation 3, scale 1.02, pure `surface`
 * background. On drop: 200ms ease-in-out settle animation.
 *
 * Deviation: the grip is a Pressable onPressIn/onPressOut affordance driving
 * the lift visual state (elevation/scale/background); there is no gesture
 * or drag library available in this codebase (Phase 2 precedent: RN
 * `Animated` only, no Reanimated/gesture-handler — design doc's
 * `SelectionRow` `control:'none'` deferral note), so pointer-tracked
 * position-swapping mid-drag is out of scope for this PR. The actual
 * reorder commit still goes through the existing up/down buttons
 * (`rank-up-*`/`rank-down-*`), unchanged, preserving the regression suite.
 */
import type { NodeRef } from '../adapter/FormAdapter.js';
import type { FormSessionStore } from '../store/FormSessionStore.js';
export interface RankWidgetProps {
    nodeRef: NodeRef;
    store: FormSessionStore;
    appearance?: string | null;
}
export declare function RankWidget({ nodeRef, store }: RankWidgetProps): import("react").JSX.Element;
//# sourceMappingURL=RankWidget.d.ts.map