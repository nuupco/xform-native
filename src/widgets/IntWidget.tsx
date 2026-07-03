/**
 * IntWidget — integer input (REQ-13).
 *
 * Parses input to integer via parseInt. NaN → does not call answerQuestion.
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface IntWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function IntWidget({ nodeRef, store, appearance }: IntWidgetProps) {
  useFormSession(store);
  const [isFocused, setIsFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('int', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function handleChange(text: string) {
    if (isReadonly) return;
    const parsed = parseInt(text.replace(/,/g, ''), 10);
    if (!isNaN(parsed)) {
      store.answerQuestion(nodeRef, parsed);
    }
  }

  const rawValue = value != null ? String(value) : '';
  const displayValue =
    variant === 'thousands-sep' && !isFocused && rawValue !== ''
      ? Number(value).toLocaleString('en-US')
      : rawValue;

  return (
    <View style={styles.container}>
      <TextInput
        testID="int-input"
        style={[styles.input, isReadonly && styles.readonly]}
        value={displayValue}
        onChangeText={handleChange}
        editable={!isReadonly}
        keyboardType="number-pad"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    fontSize: tokens.font.md,
    color: tokens.color.text,
    backgroundColor: tokens.color.background,
  },
  readonly: {
    backgroundColor: tokens.color.surface,
  },
});
