/**
 * SelectMultiWidget — renders a multi-select question (REQ-13, REQ-14).
 *
 * Value shape (ts-rosa codecs.ts:185-189, AnswerValue.ts:31):
 *   selectMulti value = readonly string[] (array of selected tokens).
 *   store.answerQuestion receives string[] directly.
 *
 * Variants (ADR-3 selectMulti):
 *   default  → checkbox list (Pressable per option)
 *   minimal  → bottom-sheet (P1 falls back to default; P2 can add sheet)
 *   others   → fall back to default (P1)
 */

import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface SelectMultiWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function SelectMultiWidget({ ref, store, appearance }: SelectMultiWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const choices = store.adapter.getChoices(ref);
  const rawValue = store.adapter.resolveValue(ref);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  resolveVariant('selectMulti', 'select', appearance); // resolves but default/minimal both render same in P1

  // Use a ref to track the current selections synchronously, avoiding stale-closure
  // issues with useState batching in React 19 when fireEvent fires multiple times.
  // The ref is initialized from resolveValue and updated on each toggle before commit.
  const rawArray: string[] = Array.isArray(rawValue) ? (rawValue as string[]) : [];
  const selectionsRef = useRef<string[]>(rawArray);
  // Keep ref in sync with store value when it changes externally (store re-render path).
  if (JSON.stringify(selectionsRef.current) !== JSON.stringify(rawArray) && rawArray.length > 0) {
    selectionsRef.current = rawArray;
  }
  const selections = selectionsRef.current;

  function handleToggle(value: string) {
    if (isReadonly) return;
    const current = selectionsRef.current;
    let next: string[];
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      next = [...current, value];
    }
    selectionsRef.current = next;
    store.answerQuestion(ref, next);
  }

  return (
    <View style={styles.container}>
      {isRequired && (
        <Text testID="required-indicator" style={styles.required}>
          *
        </Text>
      )}
      {choices.map((choice) => {
        const isSelected = selections.includes(choice.value);
        return (
          <Pressable
            key={choice.value}
            testID={`select-multi-option-${choice.value}`}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => handleToggle(choice.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected, disabled: isReadonly }}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.optionLabel}>{choice.label ?? choice.value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    marginVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  optionSelected: {
    backgroundColor: tokens.color.surface,
  },
  optionLabel: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginLeft: tokens.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primary,
  },
  checkmark: {
    color: tokens.color.background,
    fontSize: tokens.font.sm,
    fontWeight: 'bold',
  },
});
