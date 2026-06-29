/**
 * Form.tsx — navigator-driven screen-per-question component (REQ-10..REQ-12).
 *
 * ADR-1: uses useFormSession for reactivity.
 * ADR-2: switches on AdaptedEvent.kind.
 * ADR-5: dispatches to widget via pickWidget.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
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

export interface FormProps {
  store: FormSessionStore;
}

export function Form({ store }: FormProps) {
  const snapshot = useFormSession(store);
  const [advanceBlocked, setAdvanceBlocked] = useState<{
    type: 'required' | 'constraint';
    message: string;
  } | null>(null);

  // Auto-skip non-relevant nodes (REQ-10)
  useEffect(() => {
    const ev = store.adapter.getCurrentEvent();
    if (
      ev.kind === 'question' ||
      ev.kind === 'group' ||
      ev.kind === 'repeat' ||
      ev.kind === 'prompt-new-repeat'
    ) {
      if (!store.adapter.isEffectivelyRelevant(ev.ref)) {
        store.stepForward();
      }
    }
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
    const ev = store.adapter.getCurrentEvent();
    if (ev.kind === 'question') {
      const value = store.adapter.resolveValue(ev.ref);
      const nodeState = store.adapter.getNodeState(ev.ref);
      const previousResult = store.lastAnswerResult;
      const result = store.answerQuestion(ev.ref, value);
      if (
        result === AnswerResult.REQUIRED_BUT_EMPTY ||
        (nodeState.required && isValueEmpty(value))
      ) {
        setAdvanceBlocked({
          type: 'required',
          message: 'This field is required',
        });
        return;
      }
      if (
        result === AnswerResult.CONSTRAINT_VIOLATED ||
        (previousResult?.ref === ev.ref &&
          previousResult.result === AnswerResult.CONSTRAINT_VIOLATED)
      ) {
        const nodeState = store.adapter.getNodeState(ev.ref);
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
          nodeState.readonly
        );
        return (
          <View>
            <LabelHint label={ev.label} hint={ev.hint} />
            {nodeState.required && (
              <Text testID="required-indicator" style={styles.required}>
                *
              </Text>
            )}
            <Widget ref={ev.ref} store={store} appearance={ev.appearance} />
            {advanceBlocked?.type === 'constraint' && (
              <ConstraintSurface message={advanceBlocked.message} />
            )}
            {advanceBlocked?.type === 'required' && <RequiredSurface />}
          </View>
        );
      }
      case 'group':
        return (
          <View>
            <LabelHint label={ev.label} hint={ev.hint} />
          </View>
        );
      case 'repeat':
        return (
          <View>
            <LabelHint label={ev.label} hint={null} />
            <Text testID="repeat-multiplicity">Entries: {ev.multiplicity}</Text>
          </View>
        );
      case 'prompt-new-repeat':
        return (
          <View>
            <LabelHint label={ev.label} hint={null} />
            <Pressable onPress={handleNext} testID="prompt-continue">
              <Text>Continue</Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  }

  const showNav = event.kind !== 'bof' && event.kind !== 'eof';

  return (
    <View style={styles.container}>
      {renderContent()}
      {showNav && (
        <View style={styles.navRow}>
          <Pressable
            onPress={handleBack}
            testID="nav-back"
            style={styles.navButton}
          >
            <Text>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            testID="nav-next"
            style={styles.navButton}
          >
            <Text>Next</Text>
          </Pressable>
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
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
});
