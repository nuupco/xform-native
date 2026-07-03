/**
 * TriggerWidget — acknowledge/toggle control for controlType 'trigger'.
 *
 * Modeled on BooleanWidget's checkbox variant (Pressable + Text checkmark).
 * Commits the string sentinel 'OK' when tapped while unset, and clears the
 * answer to null when tapped while already 'OK' (toggleable, not one-way).
 */

import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface TriggerWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function TriggerWidget({ nodeRef, store }: TriggerWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const isChecked = value === 'OK';
  const isReadonly = nodeState?.readonly ?? false;

  function handlePress() {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, isChecked ? null : 'OK');
  }

  return (
    <View style={styles.container}>
      <Pressable
        testID="trigger-checkbox"
        style={[styles.checkbox, isChecked && styles.checkboxChecked, isReadonly && styles.disabled]}
        onPress={handlePress}
        accessibilityRole="checkbox"
        accessibilityLabel="Acknowledge"
        accessibilityState={{ checked: isChecked, disabled: isReadonly }}
      >
        {isChecked && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  checkmark: {
    color: tokens.color.background,
    fontSize: tokens.font.md,
  },
  disabled: {
    opacity: 0.5,
  },
});
