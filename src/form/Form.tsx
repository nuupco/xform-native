/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AnswerResult } from '@nuup/ts-rosa';
import { useFormSession } from '../store/useFormSession';
import { pickWidget } from '../widgets/pickWidget';
import { tokens } from '../tokens/tokens';
import type { FormSessionStore } from '../store/FormSessionStore';
import {
  BofSurface,
  EofSurface,
  ConstraintSurface,
  RequiredSurface,
  LabelHint,
} from './surfaces';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

export interface FormProps {
  store: FormSessionStore;
}

export function Form({ store }: FormProps) {
  const snapshot = useFormSession(store);
  const [advanceBlocked, setAdvanceBlocked] = useState<{
    type: 'required' | 'constraint';
    message: string;
  } | null>(null);

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

  function isValueEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

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
      const value = store.adapter.resolveValue(ev.ref);
      const nodeState = store.adapter.getNodeState(ev.ref);
      const lastResult = store.lastAnswerResult;
      if (nodeState.required && isValueEmpty(value)) {
        setAdvanceBlocked({
          type: 'required',
          message: 'This field is required',
        });
        return;
      }
      if (
        lastResult?.ref === ev.ref &&
        lastResult.result === AnswerResult.CONSTRAINT_VIOLATED
      ) {
        setAdvanceBlocked({
          type: 'constraint',
          message: nodeState.constraintMsg ?? 'Invalid value',
        });
        return;
      }
    }
    setAdvanceBlocked(null);
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
        return <BofSurface onStart={handleNext} />;
      case 'eof':
        return <EofSurface />;
      case 'question': {
        const nodeState = store.adapter.getNodeState(ev.ref);
        const { Widget } = pickWidget(
          ev.dataType,
          ev.controlType,
          ev.appearance,
          nodeState.readonly,
          ev.mediatype
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
            <LabelHint label={ev.label} hint={ev.hint} />
            {nodeState.required && (
              <Text testID="required-indicator" style={styles.required}>
                *
              </Text>
            )}
            <WidgetErrorBoundary
              key={ev.index}
              fallback={
                <View style={styles.errorFallback} testID="widget-error-fallback">
                  <Text style={styles.errorFallbackText}>
                    This question could not be displayed.
                  </Text>
                </View>
              }
            >
              <Widget
                nodeRef={ev.ref}
                store={store}
                appearance={ev.appearance}
                {...rangeProps}
              />
            </WidgetErrorBoundary>
            {advanceBlocked?.type === 'constraint' && (
              <ConstraintSurface message={advanceBlocked.message} />
            )}
            {advanceBlocked?.type === 'required' && <RequiredSurface />}
          </View>
        );
      }
      case 'group':
        return (
          <View collapsable={false}>
            <LabelHint label={ev.label} hint={ev.hint} />
          </View>
        );
      case 'repeat':
        return (
          <View collapsable={false}>
            <LabelHint label={ev.label} hint={null} />
            <Text testID="repeat-multiplicity">Entries: {ev.multiplicity}</Text>
          </View>
        );
      case 'prompt-new-repeat':
        return (
          <View collapsable={false}>
            <LabelHint label={ev.label} hint={null} />
            <TouchableOpacity onPress={handleNext} testID="prompt-continue" activeOpacity={0.7}>
              <Text>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  }

  const showNav = event.kind !== 'bof' && event.kind !== 'eof';

  return (
    <View style={styles.container} collapsable={false}>
      {renderContent()}
      {showNav && (
        <View style={styles.navRow} collapsable={false}>
          <TouchableOpacity
            onPress={handleBack}
            testID="nav-back"
            style={styles.navButton}
          >
            <Text>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            testID="nav-next"
            style={styles.navButton}
          >
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.md,
  },
  navButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
  errorFallback: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.error,
  },
  errorFallbackText: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
});
