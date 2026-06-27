/**
 * FormAdapter — public type seam between ts-rosa internals and UI components.
 *
 * ADR-2: AdaptedEvent is the firewall. No ts-rosa experimental symbol
 * (FormEntryEvent, FormIndex, FormNavigator) crosses this boundary.
 * Only plain primitives + opaque NodeRef.
 */
import type { TreeReference, NodeState, SelectChoice, AnswerResult, DataType } from '@nuup/ts-rosa';
import type { ControlType } from '@nuup/ts-rosa';
/**
 * Opaque branded reference to a form node. Widgets treat this as an
 * opaque token — only the adapter dereferences it.
 */
export type NodeRef = TreeReference & {
    readonly __brand: 'NodeRef';
};
/**
 * AdaptedEvent — discriminated union carrying only plain fields.
 * Firewall: no FormEntryEvent / FormIndex / FormElement leak.
 */
export type AdaptedEvent = {
    kind: 'question';
    ref: NodeRef;
    dataType: DataType;
    controlType: ControlType;
    appearance: string | null;
    label: string | null;
    hint: string | null;
    index: number;
} | {
    kind: 'group';
    ref: NodeRef;
    label: string | null;
    hint: string | null;
    index: number;
} | {
    kind: 'repeat';
    ref: NodeRef;
    label: string | null;
    multiplicity: number;
    index: number;
} | {
    kind: 'prompt-new-repeat';
    ref: NodeRef;
    label: string | null;
    index: number;
} | {
    kind: 'bof';
} | {
    kind: 'eof';
};
/**
 * FormAdapter — the sole translation layer between ts-rosa session internals
 * and the widget/Form layer.
 */
export interface FormAdapter {
    getCurrentEvent(): AdaptedEvent;
    stepForward(): void;
    stepBackward(): void;
    /** Jump to a previously-visited position by its 0-based numeric index. */
    jumpToIndex(index: number): void;
    getNodeState(ref: NodeRef): NodeState;
    isEffectivelyRelevant(ref: NodeRef): boolean;
    getChoices(ref: NodeRef): readonly SelectChoice[];
    answerQuestion(ref: NodeRef, value: unknown): AnswerResult;
    resolveValue(ref: NodeRef): unknown;
}
//# sourceMappingURL=FormAdapter.d.ts.map