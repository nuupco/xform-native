/**
 * UnsupportedWidget — fallback surface (REQ-09).
 *
 * Rendered when isWidgetAvailable(dataType) returns false.
 * Displays the DataType label. Does not crash.
 * Usable standalone outside <Form>.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { DataType } from '@nuup/ts-rosa';

export interface UnsupportedWidgetProps {
  dataType: DataType | string;
}

export function UnsupportedWidget({ dataType }: UnsupportedWidgetProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container} testID="unsupported-widget">
      <Text style={styles.label}>Unsupported field type: {dataType}</Text>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      padding: t.spacing.md,
      backgroundColor: t.color.roles.errorContainer,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.roles.error,
    },
    label: {
      ...t.typography.bodySmall,
      color: t.color.roles.onErrorContainer,
    },
  });
}
