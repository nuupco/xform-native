/**
 * UncastWidget — fallback for uncast/unsupported/unknown DataType (REQ-16).
 *
 * Displays raw string value if available. Does not crash.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface UncastWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function UncastWidget({ nodeRef, store }: UncastWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
  const displayValue = value != null ? String(value) : '';

  return (
    <View style={styles.container} testID="uncast-widget">
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      padding: t.spacing.md,
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.sm,
      marginVertical: t.spacing.xs,
    },
    value: {
      ...t.typography.mono,
      color: t.color.roles.onSurfaceVariant,
    },
  });
}
