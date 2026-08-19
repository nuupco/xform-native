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
} from './validation';

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

  // Direction of the most recent explicit navigation gesture (ADR-D1, REQ-3).
  // Set synchronously in handleNext/handleBack before the corresponding
  // store step, so it is already current when the auto-skip effect below
  // fires on the resulting version bump. A skip step never flips this ref —
  // a skip cascade always continues in the direction of the original gesture.
  const directionRef = useRef<'forward' | 'backward'>('forward');

  // Auto-skip effect (REQ-10 relevance-skip + REQ-3 label-skip).
  // Precedence per render pass (ADR-D2), at most one step per run:
  //   1. relevance-skip (navigable kinds, direction-aware)
  //   2. label-skip (groups only, label === null/'', direction-aware)
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
    if (ev.kind === 'group' && (ev.label === null || ev.label === '')) {
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
  }, [event.kind, eventIndex]);

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

  const handleBack = useCallback(() => {
    directionRef.current = 'backward';
    store.stepBackward();
  }, [store]);

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
      case 'question': {
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
          <View collapsable={false}>
            <LabelHint label={ev.label} hint={ev.hint} required={nodeState.required} />
            <View
              style={advanceBlocked != null ? styles.widgetSlotError : undefined}
              collapsable={false}
            >
              <WidgetErrorBoundary
                key={ev.index}
                fallback={<WidgetErrorFallback fieldName={fieldNameOf(ev.ref)} />}
              >
                <Widget
                  nodeRef={ev.ref}
                  store={store}
                  appearance={ev.appearance}
                  {...rangeProps}
                />
              </WidgetErrorBoundary>
            </View>
            {advanceBlocked &&
              renderSlot(slots?.renderError, {
                block: advanceBlocked,
                defaultElement:
                  advanceBlocked.type === 'required' ? (
                    <RequiredSurface />
                  ) : (
                    <ConstraintSurface message={advanceBlocked.message} />
                  ),
              })}
          </View>
        );
      }
      case 'group':
        return renderSlot(slots?.renderGroup, {
          event: ev,
          defaultElement: (
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
  });
}
