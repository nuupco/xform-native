/**
 * surfaces.tsx — bof / eof / required / constraint / label-hint display components.
 *
 * ADR-2: these are pure presentational components with no store dependency.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../tokens/tokens';

export function BofSurface({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.center} testID="bof-surface">
      <Text style={styles.title}>Beginning of Form</Text>
      <Pressable
        onPress={onStart}
        testID="bof-start-button"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}

export function EofSurface() {
  return (
    <View style={styles.center} testID="eof-surface">
      <Text style={styles.title}>Form Complete</Text>
    </View>
  );
}

export function ConstraintSurface({ message }: { message: string }) {
  return (
    <View testID="constraint-message">
      <Text style={styles.error}>{message}</Text>
    </View>
  );
}

export function RequiredSurface() {
  return (
    <View testID="required-message">
      <Text style={styles.error}>This field is required</Text>
    </View>
  );
}

export function LabelHint({
  label,
  hint,
}: {
  label: string | null;
  hint: string | null;
}) {
  return (
    <View>
      {label !== null && (
        <Text testID="question-label" style={styles.label}>
          {label}
        </Text>
      )}
      {hint !== null && (
        <Text testID="question-hint" style={styles.hint}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.font.lg,
    fontWeight: 'bold',
    color: tokens.color.text,
  },
  button: {
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
  },
  buttonText: {
    color: tokens.color.background,
    fontSize: tokens.font.md,
  },
  error: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
    marginTop: tokens.spacing.xs,
  },
  label: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginBottom: tokens.spacing.xs,
  },
  hint: {
    fontSize: tokens.font.sm,
    color: tokens.color.text,
    marginBottom: tokens.spacing.sm,
  },
});
