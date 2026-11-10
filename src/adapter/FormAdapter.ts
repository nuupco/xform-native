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
  | {
      kind: 'group';
      ref: NodeRef;
      label: string | null;
      hint: string | null;
      index: number;
      appearance: string | null;
    }
  | { kind: 'repeat'; ref: NodeRef; label: string | null; multiplicity: number; index: number }
  | { kind: 'prompt-new-repeat'; ref: NodeRef; label: string | null; index: number }
  | { kind: 'bof' }
  | { kind: 'eof' };

/**
 * One failing field found by `validateAll()`. `ref` is the concrete
 * instance that failed (a specific repeat instance, not the repeat's
 * generic path), so a host can jump/scroll to it directly.
 */
export interface ValidationFailure {
  readonly ref: NodeRef;
  readonly type: 'required' | 'constraint' | 'rank';
  readonly message: string;
}

/**
 * OutlineNode — one relevant entry of the whole-form outline returned by
 * `FormAdapter.getOutline()`. Plain primitives only (same firewall as
 * `AdaptedEvent`). Non-relevant nodes are never listed, so there is no
 * `relevant` flag.
 *
 * - `depth` is 0 for top-level nodes; a repeat instance is a `repeat` node
 *   (its `ref` is the concrete instance) whose children are one deeper.
 * - `label` of `group`/`repeat` is resolved with ts-rosa's `getLabelAt`
 *   (active-language itext + `<output>` substitution; inline fallback).
 * - `value` is the unwrapped raw answer (`resolveValue`); `displayValue` is
 *   the selected choice label(s) for selects (joined with ", ") and the
 *   stringified value for string/number/boolean answers, else `null`.
 */
export type OutlineNode =
  | {
      readonly kind: 'group';
      readonly ref: NodeRef;
      readonly label: string | null;
      readonly depth: number;
    }
  | {
      readonly kind: 'repeat';
      readonly ref: NodeRef;
      readonly label: string | null;
      readonly depth: number;
      readonly multiplicity: number;
    }
  | {
      readonly kind: 'question';
      readonly ref: NodeRef;
      readonly label: string | null;
      readonly depth: number;
      readonly dataType: DataType;
      readonly controlType: ControlType;
      readonly required: boolean;
      readonly answered: boolean;
      readonly value: unknown;
      readonly displayValue: string | null;
    };

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
  /**
   * Every relevant group / repeat instance / question of the form in
   * document order, WITHOUT moving the cursor (`visitedCache` and the step
   * counter are untouched) and without writing to the instance. Repeats are
   * expanded per existing instance; `prompt-new-repeat` stops are not
   * listed. O(form size): memoize per `store.getSnapshot().version`.
   */
  getOutline(): readonly OutlineNode[];
  stepForward(): void;
  stepBackward(): void;
  /**
   * Jump to ANY currently relevant position by ref (not only visited ones).
   * Returns `false` (cursor, step counter and cache untouched) when `ref`
   * is not a listed outline node or is not relevant. A ref inside an
   * `appearance="field-list"` / `"inject-values"` group lands on the
   * outermost such group's own stop (that is where `Form` renders/plans
   * it). `visitedCache` is rebuilt as the linear run of stops BOF→target
   * (exactly what `stepForward` would have visited), `stepCount` = the
   * target's ordinal, so `stepBackward`/`jumpToIndex(n <= target)` stay
   * coherent. Like stepping, it creates missing jr:count repeat instances
   * on the way.
   */
  jumpToRef(ref: NodeRef): boolean;
  /** Jump to a previously-visited position by its 0-based numeric index. */
  jumpToIndex(index: number): void;
  getNodeState(ref: NodeRef): NodeState;
  isEffectivelyRelevant(ref: NodeRef): boolean;
  getChoices(ref: NodeRef): readonly SelectChoice[];
  answerQuestion(ref: NodeRef, value: unknown): AnswerResult;
  resolveValue(ref: NodeRef): unknown;
  /**
   * The raw UTC offset string (e.g. "-06:00", "+02:00", "Z") that a `time`
   * answer at `ref` was captured with, straight off the pre-unwrap
   * `AnswerValue.offset` field (time-offset-awareness). `undefined` for any
   * non-'time' answer, or for a legacy/offset-less 'time' answer — this is
   * ADDITIVE and does not change `resolveValue`'s existing "raw primitive"
   * contract (ADR-D-A3/A7); no other widget is affected.
   */
  getAnswerOffset(ref: NodeRef): string | undefined;
  /**
   * Manually create a new instance of a repeat group at the given prompt ref
   * (Slice D — repeat-instance-creation). Throws if `ref` is not a valid
   * manual prompt-new-repeat creation context (e.g. a jr:count-bound repeat,
   * or a non-repeat ref).
   */
  createRepeatInstance(ref: NodeRef): void;
  /**
   * Delete an existing repeat instance identified by its concrete positional
   * ref (Slice E — field-list embedded repeats). Re-indexes the remaining
   * sibling instances (ts-rosa's `removeRepeatInstance` splices + shifts
   * multiplicities) and re-runs the DAG cascade for anything depending on
   * the repeat (counts, calculates) via `triggerRepeatRemoval`. Throws if
   * `ref` does not resolve to an existing instance.
   */
  removeRepeatInstance(ref: NodeRef): void;
  /**
   * Concrete positional refs (multiplicity 0..count-1) for every EXISTING
   * instance of the repeat named by `ref` (Slice E). `ref` may be any
   * concrete or template-shaped ref for that repeat — only its path/name is
   * used, not its own multiplicity. Built from `countRepeatInstances` +
   * per-index ref construction rather than a navigator walk: this is a
   * pure tree read, so it carries none of the navigator-cursor concerns
   * `planFieldList`'s own look-ahead has to work around.
   */
  getRepeatInstanceRefs(ref: NodeRef): readonly NodeRef[];
  /**
   * Raw (unresolved) `jr://` media reference from the CURRENT question's
   * label itext, for the given media form ('image' | 'audio' | 'video' |
   * 'big-image'). Mirrors ts-rosa's `getQuestionAtIndex().getLabelMediaUri`
   * — resolving that `jr://` string to a loadable URI is a host concern
   * (see createFormStore's `mediaResolver` opt), same firewall boundary as
   * `getChoices`/`resolveValue`. Returns `null` when the label carries no
   * media of that form, or when not at a question position.
   */
  getLabelMediaUri(form: string): string | null;
  /**
   * Full-form validation sweep: checks required/constraint/rank across
   * EVERY question, including every concrete instance of every repeat —
   * unlike per-step advance validation (`defaultAdvanceValidator`), which
   * only ever checks the single node the walker is currently sitting on.
   * Does not move the cursor. Returns every failure, in document +
   * repeat-instance order; empty array when the form is fully valid.
   */
  validateAll(): readonly ValidationFailure[];
  /** `true` iff `validateAll()` finds no failures. Convenience wrapper. */
  isComplete(): boolean;
  /**
   * The form's instance name (the human-readable label shown in an
   * instance/submission list), or `null` when the form defines none.
   * Passthrough to ts-rosa's `FormSession.getInstanceName()`. Reflects
   * post-revalidation-order semantics when called after `finalize()` —
   * see `FormSessionStore.finalize()` / `.serializeToXml()`.
   */
  getInstanceName(): string | null;
}
