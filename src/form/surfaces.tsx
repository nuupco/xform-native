import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../tokens/tokens';

export function BofSurface({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.center} testID="bof-surface" collapsable={false}>
      <Text style={styles.title}>Beginning of Form</Text>
      <TouchableOpacity
        onPress={onStart}
        testID="bof-start-button"
        activeOpacity={0.7}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EofSurface() {
  return (
    <View style={styles.center} testID="eof-surface" collapsable={false}>
      <Text style={styles.title}>Form Complete</Text>
    </View>
  );
}

export function ConstraintSurface({ message }: { message: string }) {
  return (
    <View testID="constraint-message" collapsable={false}>
      <Text style={styles.error}>{message}</Text>
    </View>
  );
}

export function RequiredSurface() {
  return (
    <View testID="required-message" collapsable={false}>
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
    <View collapsable={false}>
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
  // NOTE: `padding` must NOT be combined with `flex: 1` + `alignItems: 'center'`
  // on the same node. On RN 0.85 New Architecture (Fabric/Android) that trio
  // collapses descendant <Text> to zero size (text renders invisible). Edge
  // spacing is provided by the parent container instead.
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: tokens.font.xl, fontWeight: 'bold', color: tokens.color.text, marginBottom: tokens.spacing.lg },
  // `alignItems: 'center'` intentionally omitted — combined with padding it
  // zero-sizes the text on RN 0.85 Fabric/Android. Text is centered via
  // `textAlign` instead (default cross-axis stretch lets it fill the button).
  button: { marginTop: tokens.spacing.md, height: 48, backgroundColor: tokens.color.primary, borderRadius: tokens.radius.md, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: tokens.font.lg, fontWeight: '600', textAlign: 'center' },
  error: { color: tokens.color.error, fontSize: tokens.font.sm, marginTop: tokens.spacing.xs },
  label: { fontSize: tokens.font.md, color: tokens.color.text, marginBottom: tokens.spacing.xs },
  hint: { fontSize: tokens.font.sm, color: tokens.color.text, marginBottom: tokens.spacing.sm },
});
