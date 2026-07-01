/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface StringWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function StringWidget({ ref, store, appearance }: StringWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const displayValue = value != null ? String(value) : '';
  const variant = resolveVariant('string', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function handleChange(text: string) {
    if (isReadonly) return;
    store.answerQuestion(ref, text);
  }

  return (
    <View style={styles.container}>
      <TextInput
        testID="string-input"
        style={[styles.input, isReadonly && styles.readonly]}
        value={displayValue}
        onChangeText={handleChange}
        editable={!isReadonly}
        multiline={variant === 'multiline'}
        keyboardType={variant === 'numbers' ? 'numeric' : variant === 'url' ? 'url' : 'default'}
        autoCapitalize="none"
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
    color: tokens.color.text,
  },
});
