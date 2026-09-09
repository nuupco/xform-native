/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AnswerResult, refToString } from '@nuup/ts-rosa';
import { useFormSession } from '../store/useFormSession';
import { resolveWidget, useWidgetOverrides, type WidgetOverride } from '../widgets/engine/registry';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { FormSessionStore } from '../store/FormSessionStore';
import {
  BofSurface,
  EofSurface,
  ConstraintSurface,
  RequiredSurface,
  LabelHint,
  RepeatPromptCard,
  WidgetErrorFallback,
} from './surfaces';
import { PressableButton } from '../widgets/primitives/PressableButton';
import { NavRow } from './NavRow';
import { SectionIndicator } from './SectionIndicator';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { renderSlot, type FormSlots } from './slots';
import {
  defaultAdvanceValidator,
  resolveValidator,
  useValidatorOverrides,
  type AdvanceBlock,
  type ValidatorOverride,
  type QuestionEvent,
} from './validation';
import type { AdaptedEvent, NodeRef } from '../adapter/FormAdapter';

/**
 * Best-effort human-readable field name for `WidgetErrorFallback` (spec R7).
 * Production refs are real `TreeReference`s (`refToString` handles them);
 * the in-repo test fixture (`makeFakeSession`) uses plain path strings
 * directly as `ref`, which `refToString` cannot parse — fall back to the
 * raw value in that case so the fallback still shows a useful identifier.
 */
function fieldNameOf(ref: unknown): string {
  if (typeof ref === 'string') return ref;
  try {
    return refToString(ref as Parameters<typeof refToString>[0]);
  } catch {
    return String(ref);
  }
}

type GroupEvent = Extract<AdaptedEvent, { kind: 'group' }>;
type RepeatOrPromptEvent = Extract<AdaptedEvent, { kind: 'repeat' | 'prompt-new-repeat' }>;

/**
 * One rendered unit of a field-list group's plan. A flat array (not a tree)
 * even though `group-header`/`repeat-section` are themselves the product of
 * recursive look-ahead (planFieldList's own nested field-list groups, and a
 * repeat-section's per-instance scan) — flattening keeps Form.tsx's render
 * switch simple (one pass, no recursive JSX) and keeps every `QuestionEvent`
 * reachable by a single flat scan for batch validation (see `flattenPlan`).
 */
type FieldListBlock =
  | { kind: 'question'; event: QuestionEvent }
  | {
      kind: 'group-header';
      label: string | null;
      hint: string | null;
      questions: readonly QuestionEvent[];
    }
  | {
      kind: 'repeat-section';
      /** Stable identity for the section (first instance's ref, or the create-slot ref when empty) — key only, never passed to a mutation call. */
      repeatRef: NodeRef;
      /** Ref to pass to `store.createRepeatInstance()`; `null` for an engine-controlled (`jr:count`-bound) repeat that never reaches its prompt-new-repeat slot. */
      createRef: NodeRef | null;
      label: string | null;
      instances: readonly { ref: NodeRef; questions: readonly QuestionEvent[] }[];
    };

interface FieldListPlan {
  blocks: readonly FieldListBlock[];
  /** Real navigator steps from the group's own position to one past its natural end — see planFieldList's doc comment. */
  totalSteps: number;
}

/**
 * String-prefix comparison over `fieldNameOf`'s output, not `getCurrentPath`'s
 * label-based segments: labels are free-text and may repeat or be null/empty
 * across siblings, so they cannot reliably tell "still under this exact
 * group" apart from "a different group that happens to look the same". The
 * ref path is the one thing guaranteed unique per node.
 */
function isDirectChildOf(childRef: unknown, groupRef: unknown): boolean {
  const childPath = fieldNameOf(childRef);
  const groupPath = fieldNameOf(groupRef);
  const prefix = `${groupPath}/`;
  if (!childPath.startsWith(prefix)) return false;
  return !childPath.slice(prefix.length).includes('/');
}

function isDescendantOf(ref: unknown, groupRef: unknown): boolean {
  const path = fieldNameOf(ref);
  const groupPath = fieldNameOf(groupRef);
  return path === groupPath || path.startsWith(`${groupPath}/`);
}

/**
 * Look-ahead for appearance="field-list" (design point 2, extended for the
 * nested-field-list and embedded-repeat cases): collects the run of blocks
 * that are DIRECT children of `containerRef`, stopping at the first
 * non-question, non-field-list-group, non-repeat sibling — a plain (not
 * field-list) nested group, or any container two levels deep (e.g. a repeat
 * inside a plain group, or a repeat inside a repeat instance) still aborts
 * the WHOLE plan, same as before this change. Only:
 *   - a DIRECT nested `group` with `appearance === 'field-list'` (its direct
 *     questions fold in under a `group-header` sub-heading), and
 *   - a DIRECT `repeat`/`prompt-new-repeat` (each existing instance's direct
 *     questions become one `repeat-section` entry)
 * are now embedded instead of aborting.
 *
 * KNOWN LIMIT (unchanged from before this feature, restated explicitly): a
 * repeat nested inside another repeat's own instance, both inside the
 * field-list group, still aborts the whole plan — `scanDirectQuestions`
 * (used per-instance inside `buildRepeatSection`) only tolerates `question`
 * children, so any group/repeat/prompt-new-repeat found inside a repeat
 * instance aborts. This stays out of scope by design.
 *
 * ts-rosa exposes no non-mutating "peek forward" — only
 * `navigator.stepToNextEvent()` walks its real internal position. Rather
 * than adding a snapshot/restore primitive to the adapter surface (a bigger
 * API change than this feature needs), this steps the REAL adapter forward
 * the same number of times it stepped (tracked via the shared `state.steps`
 * counter threaded through every recursive/nested call below), then walks it
 * back down with `stepBackward()` before returning — `adapter.stepForward/
 * stepBackward` mutate only the navigator + the adapter's own numeric step
 * counter, never `FormSessionStore`'s version/subscribers, so nothing
 * outside this function observes the walk: no re-render, no
 * `lastAnswerResult` change, no visible side effect. `store.stepForward()`
 * (the store-level, bump-triggering method) is deliberately NOT used here
 * for that reason.
 *
 * An embedded repeat's EXISTING instances are still discovered by this same
 * navigator walk (each instance is a normal stop in the sequential event
 * stream, exactly like a plain group's direct children) — not via
 * `getRepeatInstanceRefs`. That adapter method exists for the RENDER layer
 * (Slice E: attaching a stable ref to each instance's own "Eliminar" button,
 * and to the create-instance action) where there is no lookahead in
 * progress and no navigator position to preserve.
 */
function scanDirectQuestions(
  store: FormSessionStore,
  containerRef: NodeRef,
  state: { steps: number },
  firstEv?: AdaptedEvent
): { questions: QuestionEvent[]; aborted: boolean; next: AdaptedEvent } {
  const adapter = store.adapter;
  const questions: QuestionEvent[] = [];
  let ev = firstEv;

  for (;;) {
    if (ev === undefined) {
      adapter.stepForward();
      state.steps++;
      ev = adapter.getCurrentEvent();
    }
    if (ev.kind === 'question' && isDirectChildOf(ev.ref, containerRef)) {
      questions.push(ev);
      ev = undefined;
      continue;
    }
    if (
      (ev.kind === 'group' || ev.kind === 'repeat' || ev.kind === 'prompt-new-repeat') &&
      isDescendantOf(ev.ref, containerRef)
    ) {
      return { questions, aborted: true, next: ev };
    }
    return { questions, aborted: false, next: ev };
  }
}

/**
 * Collects one `repeat-section` block: every EXISTING instance's direct
 * questions (`scanDirectQuestions` against that instance's own concrete
 * ref), then steps past the trailing `prompt-new-repeat` slot exactly like
 * `scanDirectQuestions` does at a plain group/nested-field-list boundary —
 * or, for a `jr:count`-bound repeat that never reaches one, whatever real
 * sibling event follows the last instance. Returns `null` (documented limit)
 * when any instance itself contains a group/repeat/prompt-new-repeat
 * descendant.
 *
 * Until @nuup/ts-rosa 0.5.2, stepping past a repeat's `prompt-new-repeat`
 * slot here was unsafe: `stepBackward()` from one step past it, when the
 * path back passed through a repeat WITH an existing instance, did not
 * retrace the same number of steps it took forward, so the read-only
 * look-ahead's rewind overshot past `bof` (root cause: `setRepeatNextMultiplicity`
 * resolved directly to the last EXISTING instance instead of the "next slot"
 * `incrementHelper` produces on the way forward). Verified fixed in 0.5.2 —
 * a standalone repro against the real adapter with 0, 1, and 2 existing
 * instances now round-trips symmetrically in all three cases — so this no
 * longer needs the "stop at the slot" workaround.
 */
function buildRepeatSection(
  store: FormSessionStore,
  firstEv: RepeatOrPromptEvent,
  containerRef: NodeRef,
  state: { steps: number }
): {
  section: Extract<FieldListBlock, { kind: 'repeat-section' }>;
  next: AdaptedEvent;
} | null {
  const instances: { ref: NodeRef; questions: readonly QuestionEvent[] }[] = [];
  const label = firstEv.label;
  const repeatRef = firstEv.ref;
  let cur: AdaptedEvent = firstEv;
  let createRef: NodeRef | null = null;

  while (cur.kind === 'repeat' && isDirectChildOf(cur.ref, containerRef)) {
    const scan = scanDirectQuestions(store, cur.ref, state);
    if (scan.aborted) return null;
    instances.push({ ref: cur.ref, questions: scan.questions });
    cur = scan.next;
  }

  if (cur.kind === 'prompt-new-repeat' && isDirectChildOf(cur.ref, containerRef)) {
    createRef = cur.ref;
    store.adapter.stepForward();
    state.steps++;
    cur = store.adapter.getCurrentEvent();
  }

  return {
    section: { kind: 'repeat-section', repeatRef, createRef, label, instances },
    next: cur,
  };
}

function scanFieldListBlocks(
  store: FormSessionStore,
  containerRef: NodeRef,
  state: { steps: number },
  firstEv?: AdaptedEvent
): { blocks: FieldListBlock[]; aborted: boolean; next: AdaptedEvent } {
  const blocks: FieldListBlock[] = [];
  let pending = firstEv;

  for (;;) {
    const scan = scanDirectQuestions(store, containerRef, state, pending);
    pending = undefined;
    for (const q of scan.questions) blocks.push({ kind: 'question', event: q });

    if (!scan.aborted) {
      return { blocks, aborted: false, next: scan.next };
    }

    const ev = scan.next;

    if (
      ev.kind === 'group' &&
      isDirectChildOf(ev.ref, containerRef) &&
      ev.appearance === 'field-list'
    ) {
      const nested = scanFieldListBlocks(store, ev.ref, state);
      if (nested.aborted) {
        return { blocks, aborted: true, next: nested.next };
      }
      const nestedQuestions: QuestionEvent[] = [];
      let deepOk = true;
      for (const b of nested.blocks) {
        if (b.kind === 'question') nestedQuestions.push(b.event);
        else {
          deepOk = false;
          break;
        }
      }
      if (!deepOk) {
        return { blocks, aborted: true, next: nested.next };
      }
      blocks.push({ kind: 'group-header', label: ev.label, hint: ev.hint, questions: nestedQuestions });
      pending = nested.next;
      continue;
    }

    if (
      (ev.kind === 'repeat' || ev.kind === 'prompt-new-repeat') &&
      isDirectChildOf(ev.ref, containerRef)
    ) {
      const result = buildRepeatSection(store, ev, containerRef, state);
      if (result === null) return { blocks, aborted: true, next: ev };
      blocks.push(result.section);
      pending = result.next;
      continue;
    }

    return { blocks, aborted: true, next: ev };
  }
}

function planFieldList(store: FormSessionStore, group: GroupEvent): FieldListPlan | null {
  const state = { steps: 0 };
  const result = scanFieldListBlocks(store, group.ref, state);
  for (let i = 0; i < state.steps; i++) store.adapter.stepBackward();
  return result.aborted ? null : { blocks: result.blocks, totalSteps: state.steps };
}

/** Flattens every `QuestionEvent` out of a plan's blocks, in document order — used for batch validation/progress/step-count (design point 4). */
function flattenPlanQuestions(blocks: readonly FieldListBlock[]): QuestionEvent[] {
  const out: QuestionEvent[] = [];
  for (const b of blocks) {
    if (b.kind === 'question') out.push(b.event);
    else if (b.kind === 'group-header') out.push(...b.questions);
    else for (const inst of b.instances) out.push(...inst.questions);
  }
  return out;
}

export interface FormProps {
  store: FormSessionStore;
  /** Additive (widget-registry, D5): frozen at mount, wins tie-break over context entries. */
  widgets?: readonly WidgetOverride[];
  /** Additive (form-composition-slots, D6): optional render-prop overrides for nav/error/group. */
  slots?: FormSlots;
  /** Additive (form-validation-hooks, D7/D8): frozen at mount, wins tie-break over context entries. */
  validators?: readonly ValidatorOverride[];
  /** Additive (design decision 7): forwarded to BofSurface/EofSurface subtitle; omitted → subtitle hidden. */
  formTitle?: string;
  formVersion?: string;
}

export function Form({
  store,
  widgets: widgetsProp,
  slots,
  validators: validatorsProp,
  formTitle,
  formVersion,
}: FormProps) {
  const styles = useThemedStyles(createStyles);
  const snapshot = useFormSession(store);
  const contextOverrides = useWidgetOverrides();
  // Freeze overrides at mount (design data-flow): context first, then the
  // `widgets` prop — pickBest scans in order and ties go to the LAST entry,
  // so appending prop entries last makes them win the tie-break (D5).
  const overridesRef = useRef<readonly WidgetOverride[]>([
    ...contextOverrides,
    ...(widgetsProp ?? []),
  ]);
  const contextValidatorOverrides = useValidatorOverrides();
  // Same freeze-at-mount + context-then-prop tie-break pattern as widgets (D8).
  const validatorOverridesRef = useRef<readonly ValidatorOverride[]>([
    ...contextValidatorOverrides,
    ...(validatorsProp ?? []),
  ]);
  const [advanceBlocked, setAdvanceBlocked] = useState<AdvanceBlock | null>(null);
  // Batch equivalent of `advanceBlocked` for a field-list group's Next
  // (design point 4) — keyed by each blocked question's own `index`, additive
  // alongside the existing singular `AdvanceBlock` (validation.ts's
  // AdvanceValidator/AdvanceBlock signature stays untouched; custom
  // validators outside field-list keep calling it exactly as before).
  const [fieldListBlocked, setFieldListBlocked] = useState<Map<number, AdvanceBlock> | null>(
    null
  );

  // Direction of the most recent explicit navigation gesture (ADR-D1, REQ-3).
  // Set synchronously in handleNext/handleBack before the corresponding
  // store step, so it is already current when the auto-skip effect below
  // fires on the resulting version bump. A skip step never flips this ref —
  // a skip cascade always continues in the direction of the original gesture.
  const directionRef = useRef<'forward' | 'backward'>('forward');

  // Auto-skip effect (REQ-10 relevance-skip + REQ-3 label-skip).
  // Precedence per render pass (ADR-D2), at most one step per run:
  //   1. relevance-skip (navigable kinds, direction-aware)
  //   2. label-skip (groups and repeat-entry, label === null/'', direction-aware)
  //   3. no-op (settled — render current event)
  useEffect(() => {
    const ev = store.adapter.getCurrentEvent();
    const dir = directionRef.current;
    const step = () => (dir === 'backward' ? store.stepBackward() : store.stepForward());

    const navigable =
      ev.kind === 'question' ||
      ev.kind === 'group' ||
      ev.kind === 'repeat' ||
      ev.kind === 'prompt-new-repeat';

    if (navigable && !store.adapter.isEffectivelyRelevant(ev.ref)) {
      step();
      return;
    }
    if ((ev.kind === 'group' || ev.kind === 'repeat') && (ev.label === null || ev.label === '')) {
      step();
      return;
    }
    // settled: render current event
  }, [snapshot.version, store]);

  // Clear validation block when the event changes
  const event = store.adapter.getCurrentEvent();
  const eventIndex =
    event.kind === 'bof' || event.kind === 'eof' ? -1 : event.index;
  useEffect(() => {
    setAdvanceBlocked(null);
    setFieldListBlocked(null);
  }, [event.kind, eventIndex]);

  // Recomputed every render (cheap — bounded by the group's own direct
  // question count, and side-effect-free per planFieldList's doc comment).
  // Kept in a ref so handleNext (a useCallback frozen with only `store` as a
  // dep) can read the current plan without becoming stale.
  const fieldListPlan =
    event.kind === 'group' && event.appearance === 'field-list'
      ? planFieldList(store, event)
      : null;
  const fieldListPlanRef = useRef<FieldListPlan | null>(null);
  fieldListPlanRef.current = fieldListPlan;

  // EofSurface answered/skipped summary (design decision 8): a form-local
  // record of this session's navigation path — not a "whole form" total,
  // which FormAdapter has no capability to compute. Recorded each time the
  // rendered event moves away from a 'question' event: 'answered' if the
  // last committed answerQuestion result for that ref was OK, otherwise
  // 'skipped' (never answered, or answered with a still-invalid value).
  const progressRef = useRef<Map<number, 'answered' | 'skipped'>>(new Map());
  const prevQuestionRef = useRef<{ ref: unknown; index: number } | null>(null);
  useEffect(() => {
    const prev = prevQuestionRef.current;
    if (prev && prev.index !== eventIndex) {
      const lastResult = store.lastAnswerResult;
      const wasAnswered =
        lastResult !== null && lastResult.ref === prev.ref && lastResult.result === AnswerResult.OK;
      progressRef.current.set(prev.index, wasAnswered ? 'answered' : 'skipped');
    }
    prevQuestionRef.current = event.kind === 'question' ? { ref: event.ref, index: event.index } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIndex, event.kind]);

  const handleNext = useCallback(() => {
    directionRef.current = 'forward';
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind === 'question') {
      // Validate-only (ADR-D-A5, REQ-3): every widget already commits on
      // change via store.answerQuestion, and evaluator.answerQuestion never
      // persists a constraint-violated value. So by the time Next is
      // pressed, the stored value is always constraint-valid, and
      // store.lastAnswerResult records the outcome of the last real commit
      // attempt for this ref. Next must never unconditionally re-commit.
      //
      // Validation is a plain callback (D7), not a hook: resolveValidator()
      // is a synchronous lookup, not a conditional hook call, so it cannot
      // threaten the select-widgets-hook-order invariant. defaultValidate()
      // lets a custom validator compose over the extracted default logic
      // instead of reimplementing required/constraint checks from scratch.
      const validate =
        resolveValidator(ev, validatorOverridesRef.current) ?? defaultAdvanceValidator;
      const block = validate({
        nodeRef: ev.ref,
        store,
        event: ev,
        defaultValidate: () => defaultAdvanceValidator({ nodeRef: ev.ref, store, event: ev, defaultValidate: () => null }),
      });
      if (block) {
        setAdvanceBlocked(block);
        return;
      }
    } else if (ev.kind === 'group' && fieldListPlanRef.current !== null) {
      // Confirmed field-list (design point 4): validate every collected
      // question (top-level, nested-group-header, and every repeat-section
      // instance — flattened by flattenPlanQuestions), surface ALL
      // simultaneous blocks (not just the first), and only advance past the
      // whole group when none of them block.
      const plan = fieldListPlanRef.current;
      const questions = flattenPlanQuestions(plan.blocks);
      const blocks = new Map<number, AdvanceBlock>();
      for (const q of questions) {
        const validate =
          resolveValidator(q, validatorOverridesRef.current) ?? defaultAdvanceValidator;
        const block = validate({
          nodeRef: q.ref,
          store,
          event: q,
          defaultValidate: () =>
            defaultAdvanceValidator({ nodeRef: q.ref, store, event: q, defaultValidate: () => null }),
        });
        if (block) blocks.set(q.index, block);
      }
      if (blocks.size > 0) {
        setFieldListBlocked(blocks);
        return;
      }
      setFieldListBlocked(null);
      // Progress bookkeeping (design point 5): the single-question
      // `prevQuestionRef` effect below only ever sees the last question
      // touched via `store.lastAnswerResult` (a single scalar) — it cannot
      // attribute per-field outcomes across N fields left simultaneously.
      // Record each field-list question's answered/skipped status directly
      // from its resolved value (the same "empty?" test defaultAdvanceValidator
      // uses for its required check) before stepping past all of them.
      for (const q of questions) {
        const value = store.adapter.resolveValue(q.ref);
        const skipped = value === null || value === undefined || value === '';
        progressRef.current.set(q.index, skipped ? 'skipped' : 'answered');
      }
      // Step forward exactly as many times as the read-only look-ahead did
      // to reach one-past-the-group's natural end (`totalSteps` — no longer
      // simply "question count + 1" now that a plan can also contain
      // group-header/repeat-section blocks of varying real event-length).
      for (let i = 0; i < plan.totalSteps; i++) store.stepForward();
      return;
    }
    setAdvanceBlocked(null);
    store.stepForward();
  }, [store]);

  const handleCreateRepeat = useCallback(() => {
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind !== 'prompt-new-repeat') return;
    directionRef.current = 'forward';
    store.createRepeatInstance(ev.ref);
    store.stepForward();
  }, [store]);

  // Add/remove an instance of a repeat-section embedded in a field-list
  // group (design point 3). Unlike handleCreateRepeat, this never touches
  // directionRef or steps the navigator: the screen we're on IS the
  // field-list group's own render, and it stays there — the mutation alone
  // (create/removeRepeatInstance both bump the store's version) is enough
  // to trigger a re-render, and `fieldListPlan` is already recomputed from
  // scratch on every render, so the new/removed instance shows up with no
  // extra wiring. The rest of screen-local state (advanceBlocked,
  // fieldListBlocked, progressRef, ...) lives in refs/state untouched by
  // this mutation, so it survives exactly as-is.
  const handleAddRepeatInstance = useCallback(
    (ref: NodeRef) => {
      store.createRepeatInstance(ref);
    },
    [store]
  );

  const handleRemoveRepeatInstance = useCallback(
    (ref: NodeRef) => {
      store.removeRepeatInstance(ref);
    },
    [store]
  );

  const handleBack = useCallback(() => {
    directionRef.current = 'backward';
    store.stepBackward();
  }, [store]);

  function renderQuestionField(ev: QuestionEvent, block: AdvanceBlock | null) {
    const nodeState = store.adapter.getNodeState(ev.ref);
    const { Widget } = resolveWidget(
      {
        dataType: ev.dataType,
        controlType: ev.controlType,
        appearance: ev.appearance,
        readonly: nodeState.readonly,
        mediatype: ev.mediatype,
      },
      overridesRef.current
    );
    const rangeProps =
      ev.rangeBounds != null
        ? {
            start: ev.rangeBounds.start,
            end: ev.rangeBounds.end,
            step: ev.rangeBounds.step,
          }
        : {};
    return (
      <View key={ev.index} collapsable={false}>
        <LabelHint label={ev.label} hint={ev.hint} required={nodeState.required} />
        <View style={block != null ? styles.widgetSlotError : undefined} collapsable={false}>
          <WidgetErrorBoundary
            key={ev.index}
            fallback={<WidgetErrorFallback fieldName={fieldNameOf(ev.ref)} />}
          >
            <Widget nodeRef={ev.ref} store={store} appearance={ev.appearance} {...rangeProps} />
          </WidgetErrorBoundary>
        </View>
        {block &&
          renderSlot(slots?.renderError, {
            block,
            defaultElement:
              block.type === 'required' ? (
                <RequiredSurface />
              ) : (
                <ConstraintSurface message={block.message} />
              ),
          })}
      </View>
    );
  }

  function renderFieldListBlock(block: FieldListBlock, key: number) {
    if (block.kind === 'question') {
      return renderQuestionField(block.event, fieldListBlocked?.get(block.event.index) ?? null);
    }
    if (block.kind === 'group-header') {
      return (
        <View key={key} collapsable={false} style={styles.fieldListSubGroup}>
          <LabelHint label={block.label} hint={block.hint} />
          {block.questions.map((q) => renderQuestionField(q, fieldListBlocked?.get(q.index) ?? null))}
        </View>
      );
    }
    // repeat-section: each existing instance in its own visual block, with a
    // per-instance "Eliminar" button, plus one "+ Agregar" prompt at the end
    // (design point 3) — reuses the same `RepeatPromptCard` the top-level
    // prompt-new-repeat screen uses. `createRef` is null only for a
    // `jr:count`-bound repeat (engine-controlled count, never manually
    // added to), in which case the prompt is simply omitted.
    return (
      <View key={key} collapsable={false} style={styles.fieldListSubGroup}>
        {block.instances.map((inst, i) => (
          <View key={i} collapsable={false} style={styles.repeatInstanceCard}>
            <LabelHint label={`${block.label ?? ''} ${i + 1}`.trim()} hint={null} />
            {inst.questions.map((q) => renderQuestionField(q, fieldListBlocked?.get(q.index) ?? null))}
            <PressableButton
              testID={`field-list-repeat-remove-${i}`}
              label="Eliminar"
              variant="text"
              tone="error"
              onPress={() => handleRemoveRepeatInstance(inst.ref)}
            />
          </View>
        ))}
        {block.createRef !== null && (
          <RepeatPromptCard
            label={block.label ?? ''}
            onPress={() => handleAddRepeatInstance(block.createRef as NodeRef)}
          />
        )}
      </View>
    );
  }

  function renderContent() {
    const ev = event;
    switch (ev.kind) {
      case 'bof':
        return <BofSurface onStart={handleNext} formTitle={formTitle} formVersion={formVersion} />;
      case 'eof': {
        let answered = 0;
        let skipped = 0;
        for (const outcome of progressRef.current.values()) {
          if (outcome === 'answered') answered += 1;
          else skipped += 1;
        }
        return <EofSurface answeredCount={answered} skippedCount={skipped} />;
      }
      case 'question':
        return renderQuestionField(ev, advanceBlocked);
      case 'group':
        return renderSlot(slots?.renderGroup, {
          event: ev,
          defaultElement:
            fieldListPlan !== null ? (
              <View collapsable={false}>
                <LabelHint label={ev.label} hint={ev.hint} />
                {fieldListPlan.blocks.map((block, i) => renderFieldListBlock(block, i))}
              </View>
            ) : (
              <View collapsable={false}>
                <LabelHint label={ev.label} hint={ev.hint} />
              </View>
            ),
        });
      case 'repeat':
        // The old "Entries: N" line (ev.multiplicity + 1) was deleted here
        // (Phase 7 decision 14): it was English in an otherwise-Spanish UI,
        // it was not actually a total (its own comment used to admit that),
        // and SectionIndicator now shows the same information correctly
        // ("Parcela 2 de 4") on every screen, not only this one.
        return renderSlot(slots?.renderGroup, {
          event: ev,
          defaultElement: (
            <View collapsable={false}>
              <LabelHint label={ev.label} hint={null} />
            </View>
          ),
        });
      case 'prompt-new-repeat':
        return (
          <View collapsable={false}>
            <LabelHint label={ev.label} hint={null} />
            <RepeatPromptCard label={ev.label ?? ''} onPress={handleCreateRepeat} />
          </View>
        );
      default:
        return null;
    }
  }

  const showNav = event.kind !== 'bof' && event.kind !== 'eof';
  // Section/repeat position indicator (Phase 7 decisions 7, 8): default-on,
  // rendered at the top of the scroll content for every "in-form" event
  // kind (same set as `showNav` — never bof/eof). `getCurrentPath()` itself
  // returns [] for a flat top-level question, and `SectionIndicator` (or a
  // host's own `renderSectionIndicator` override) renders nothing for an
  // empty path, so no extra "is there anything to show" gating is needed
  // beyond `showNav`.
  const sectionPath = showNav ? store.adapter.getCurrentPath() : [];

  return (
    <View style={styles.container} collapsable={false}>
      {/* Neither Form nor its host app is guaranteed to wrap question
          content in a scroll container — a select with many choices (or any
          long content) can be taller than the screen. Own the scroll here so
          content never overflows past the top/bottom with no way to reach
          it, while nav stays pinned outside the scroll. */}
      <ScrollView
        testID="form-content-scroll"
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollInner}
        keyboardShouldPersistTaps="handled"
      >
        {showNav &&
          renderSlot(slots?.renderSectionIndicator, {
            path: sectionPath,
            defaultElement: <SectionIndicator path={sectionPath} />,
          })}
        {renderContent()}
      </ScrollView>
      {showNav &&
        renderSlot(slots?.renderNavigation, {
          onBack: handleBack,
          onNext: handleNext,
          defaultElement: <NavRow onBack={handleBack} onNext={handleNext} />,
        })}
    </View>
  );
}

// `isLastStep` is intentionally NOT wired here (design decision 9): FormAdapter
// has no non-mutating lookahead to detect "next step is eof" without a real
// stepForward() call, which would fire the auto-skip effect and bump version —
// a behavior change out of this phase's appearance-only scope. NavRow's own
// `variant:'finish'` rendering is fully built/tested (PR2); Eof already shows
// the gold "Finalizar" treatment on its own Finish button. This is a
// documented follow-up, not an oversight.

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contentScroll: {
      flex: 1,
    },
    contentScrollInner: {
      padding: t.spacing.md,
      flexGrow: 1,
    },
    widgetSlotError: {
      borderWidth: 2,
      borderColor: t.color.roles.error,
      borderRadius: t.radius.md,
    },
    fieldListSubGroup: {
      marginTop: t.spacing.md,
      gap: t.spacing.sm,
    },
    repeatInstanceCard: {
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.md,
      padding: t.spacing.md,
      marginBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
  });
}
