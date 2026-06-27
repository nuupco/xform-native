/**
 * UnsupportedWidget — fallback surface (REQ-09).
 *
 * Rendered when isWidgetAvailable(dataType) returns false.
 * Displays the DataType label. Does not crash.
 * Usable standalone outside <Form>.
 */

import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../tokens/tokens';
import type { DataType } from '@nuup/ts-rosa';

export interface UnsupportedWidgetProps {
  dataType: DataType | string;
}

export function UnsupportedWidget({ dataType }: UnsupportedWidgetProps) {
  return (
    <View style={styles.container} testID="unsupported-widget">
      <Text style={styles.label}>Unsupported field type: {dataType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.error,
  },
  label: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
});
