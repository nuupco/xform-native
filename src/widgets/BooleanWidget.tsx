/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * Variants (ADR-3):
 *   default → SegmentedButton (Sí/No), replaces the native `Switch` (design
 *     decision 5): `Switch` is native-rendered (only tintable, not M3-shaped)
 *     and its ~30dp thumb fails the glove-use target. `testID="boolean-switch"`
 *     is preserved on the container as a compatibility contract.
 *   checkbox → Pressable checkbox (custom, no native module)
 *
 * Unanswered state maps to SegmentedButton's `value: null`, so it is visually
 * distinct from an explicit "No" — neither segment renders as selected.
 */

import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { SegmentedButton } from './primitives/SegmentedButton';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface BooleanWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: t.color.roles.primary,
      borderColor: t.color.roles.primary,
    },
    checkmark: {
      color: t.color.roles.onPrimary,
      fontSize: t.typography.bodyLarge.fontSize,
    },
    disabled: {
      opacity: t.disabled.contentOpacity,
    },
  });
}

/** Maps the resolved store value to the SegmentedButton's tri-state value. */
function toSegmentValue(value: unknown): 'true' | 'false' | null {
  if (value === true || value === 'true' || value === '1') return 'true';
  if (value === false || value === 'false' || value === '0') return 'false';
  return null;
}

const BOOLEAN_OPTIONS: readonly [
  { value: 'true'; label: string },
  { value: 'false'; label: string },
] = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
];

export function BooleanWidget({ nodeRef, store, appearance }: BooleanWidgetProps) {
  const styles = useThemedStyles(createStyles);
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
        <SegmentedButton
          testID="boolean-switch"
          options={BOOLEAN_OPTIONS}
          value={toSegmentValue(value)}
          onChange={(segment) => handleChange(segment === 'true')}
          disabled={isReadonly}
        />
      )}
    </View>
  );
}
