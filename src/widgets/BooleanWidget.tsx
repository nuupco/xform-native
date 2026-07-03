/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * Variants (ADR-3):
 *   default → Switch
 *   checkbox → Pressable checkbox (custom, no native module)
 */

import { View, Switch, Pressable, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface BooleanWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function BooleanWidget({ nodeRef, store, appearance }: BooleanWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const boolValue = value === true || value === 'true' || value === '1';
  const variant = resolveVariant('boolean', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function handleChange(newValue: boolean) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, newValue);
  }

  return (
    <View style={styles.container}>
      {variant === 'checkbox' ? (
        <Pressable
          testID="boolean-checkbox"
          style={[styles.checkbox, boolValue && styles.checkboxChecked, isReadonly && styles.disabled]}
          onPress={() => handleChange(!boolValue)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: boolValue, disabled: isReadonly }}
        >
          {boolValue && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
      ) : (
        <Switch
          testID="boolean-switch"
          value={boolValue}
          onValueChange={handleChange}
          disabled={isReadonly}
          trackColor={{ true: tokens.color.primary }}
        />
      )}
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
