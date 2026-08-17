/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { resolveVariant } from './appearance';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface StringWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: t.color.text,
      borderRadius: t.radius.sm,
      padding: t.spacing.sm,
      fontSize: t.font.md,
      color: t.color.text,
      backgroundColor: t.color.background,
    },
    readonly: {
      backgroundColor: t.color.surface,
      color: t.color.text,
    },
  });
}

export function StringWidget({ nodeRef, store, appearance }: StringWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const displayValue = value != null ? String(value) : '';
  const variant = resolveVariant('string', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function handleChange(text: string) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, text);
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

