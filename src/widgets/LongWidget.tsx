/**
 * LongWidget — long integer input (REQ-13).
 *
 * Uses parseFloat (JavaScript has no 64-bit int; long is a large number).
 */

import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface LongWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function LongWidget({ ref, store, appearance }: LongWidgetProps) {
  useFormSession(store);
  const [isFocused, setIsFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const variant = resolveVariant('long', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;

  function handleChange(text: string) {
    if (isReadonly) return;
    const parsed = parseFloat(text.replace(/,/g, ''));
    if (!isNaN(parsed)) {
      store.answerQuestion(ref, parsed);
    }
  }

  const rawValue = value != null ? String(value) : '';
  const displayValue =
    variant === 'thousands-sep' && !isFocused && rawValue !== ''
      ? Number(value).toLocaleString('en-US')
      : rawValue;

  return (
    <View style={styles.container}>
      {isRequired && <Text testID="required-indicator" style={styles.required}>*</Text>}
      <TextInput
        testID="long-input"
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
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
});
