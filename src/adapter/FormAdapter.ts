/**
 * FormAdapter — public type seam between ts-rosa internals and UI components.
 *
 * ADR-2: AdaptedEvent is the firewall. No ts-rosa experimental symbol
 * (FormEntryEvent, FormIndex, FormNavigator) crosses this boundary.
 * Only plain primitives + opaque NodeRef.
 */

import type {
  TreeReference,
  NodeState,
  SelectChoice,
  AnswerResult,
  DataType,
} from '@nuup/ts-rosa';

import type { ControlType } from '@nuup/ts-rosa';

/**
 * Opaque branded reference to a form node. Widgets treat this as an
 * opaque token — only the adapter dereferences it.
 */
export type NodeRef = TreeReference & { readonly __brand: 'NodeRef' };

/**
 * PathSegment — one ancestor group/repeat on the way to the walker's
 * current position, root→leaf order (Phase 7 decision 3).
 *
 * Firewall (ADR-2): only plain primitives cross here — no `FormElement`
 * (ts-rosa's parsed body element) is ever exposed to callers.
 *
 * - For a `question` event, the path EXCLUDES the question leaf itself.
 * - For a `group` / `repeat` / `prompt-new-repeat` event, the leaf
 *   container itself IS included as the final segment — this is what lets
 *   an indicator built from this path read correctly while the walker is
 *   sitting on the container's own stop, not only while inside it.
 * - `multiplicity` / `total` are `null` for `group` segments (groups do
 *   not repeat).
 * - `total` is always the LIVE created-instance count
 *   (`countRepeatInstances`), never a parse of `countExpr` (decision 6).
 * - `countBound` is `true` iff the repeat's `countExpr` (`jr:count`) is
 *   non-null — i.e. the engine, not the user, controls instance count.
 *
 * Known limitation (decision 5): `label` comes from `FormElement.labelText`
 * only. `group`/`repeat` elements expose no itext id and no `<output>`
 * capture (unlike `question`), so an itext-driven or `<output>`-bearing
 * container label is not resolved here — it will read as its raw literal
 * text (or `null` if there is none), never itext-substituted. This is a
 * ts-rosa-side follow-up (see Phase 7 design Open Questions), not a bug in
 * this adapter.
 */
export type PathSegment =
  | {
      kind: 'group';
      label: string | null;
      multiplicity: null;
      total: null;
      countBound: false;
    }
  | {
      kind: 'repeat';
      label: string | null;
      multiplicity: number;
      total: number;
      countBound: boolean;
    };

/**
 * AdaptedEvent — discriminated union carrying only plain fields.
 * Firewall: no FormEntryEvent / FormIndex / FormElement leak.
 */
export type AdaptedEvent =
  | {
      kind: 'question';
      ref: NodeRef;
      dataType: DataType;
      controlType: ControlType;
      appearance: string | null;
      label: string | null;
      hint: string | null;
      index: number;
      rangeBounds: { start?: number; end?: number; step?: number } | null;
      mediatype: string | null;
    }
  | { kind: 'group'; ref: NodeRef; label: string | null; hint: string | null; index: number }
  | { kind: 'repeat'; ref: NodeRef; label: string | null; multiplicity: number; index: number }
  | { kind: 'prompt-new-repeat'; ref: NodeRef; label: string | null; index: number }
  | { kind: 'bof' }
  | { kind: 'eof' };

/**
 * FormAdapter — the sole translation layer between ts-rosa session internals
 * and the widget/Form layer.
 */
export interface FormAdapter {
  getCurrentEvent(): AdaptedEvent;
  /**
   * The root→leaf chain of ancestor group/repeat segments for the walker's
   * current position (Phase 7 decision 1-3). A separate method rather than
   * a field on `AdaptedEvent`: `Form.tsx` calls `getCurrentEvent()` several
   * times per render pass (auto-skip effect, `handleNext`,
   * `handleCreateRepeat`, top-level render), and most of those call sites
   * only ever read `ev.kind` — widening the event would make every one of
   * them pay for a path derivation it never uses. This method is called
   * once, only when a consumer (the section indicator) actually needs it.
   *
   * Returns `[]` for `bof`/`eof`, for a flat top-level question with no
   * ancestor group/repeat, and when the underlying navigator has no
   * `resolvePath` support (defensive — keeps older test doubles working).
   */
  getCurrentPath(): readonly PathSegment[];
  stepForward(): void;
  stepBackward(): void;
  /** Jump to a previously-visited position by its 0-based numeric index. */
  jumpToIndex(index: number): void;
  getNodeState(ref: NodeRef): NodeState;
  isEffectivelyRelevant(ref: NodeRef): boolean;
  getChoices(ref: NodeRef): readonly SelectChoice[];
  answerQuestion(ref: NodeRef, value: unknown): AnswerResult;
  resolveValue(ref: NodeRef): unknown;
  /**
   * Manually create a new instance of a repeat group at the given prompt ref
   * (Slice D — repeat-instance-creation). Throws if `ref` is not a valid
   * manual prompt-new-repeat creation context (e.g. a jr:count-bound repeat,
   * or a non-repeat ref).
   */
  createRepeatInstance(ref: NodeRef): void;
}
