/**
 * UncastWidget — fallback for uncast/unsupported/unknown DataType (REQ-16).
 *
 * Displays raw string value if available. Does not crash.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface UncastWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function UncastWidget({ ref, store }: UncastWidgetProps) {
  useFormSession(store);
  const value = store.adapter.resolveValue(ref);
  const displayValue = value != null ? String(value) : '';

  return (
    <View style={styles.container} testID="uncast-widget">
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    marginVertical: tokens.spacing.xs,
  },
  value: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
  },
});
