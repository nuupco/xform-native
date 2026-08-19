import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  PressableButton,
  useTheme,
  useThemedStyles,
  type FormLoadPhase,
  type Theme,
} from '@nuup/xform-native';

/**
 * Presentational-only progress overlay shown while `createFormStore` is
 * resolving a form. Indeterminate by design: no yield points exist upstream
 * yet, so there is no denominator for a percentage bar — instead this shows
 * an elapsed-seconds ticker plus a staged phase label, and a cancel button.
 *
 * Props-only/dumb per design boundary: no internal state derived from
 * ts-rosa, no side effects beyond the local elapsed-seconds ticker. The
 * example app has no jest config, so this component intentionally carries
 * zero logic worth unit-testing on its own — the cancel/discard contract it
 * triggers is tested in `src/loadCancellation.test.ts`.
 */

const PHASE_LABELS: Record<FormLoadPhase, string> = {
  parseForm: 'Leyendo formulario…',
  resolveExternalInstances: 'Cargando datos externos…',
  createFormSession: 'Preparando formulario…',
  total: 'Cargando formulario…',
};

export interface FormLoadingOverlayProps {
  /** Current staged phase label, or `null` before the first phase starts. */
  phase: FormLoadPhase | null;
  onCancel: () => void;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
    phaseLabel: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurfaceVariant,
      textAlign: 'center',
    },
    elapsed: {
      ...t.typography.bodySmall,
      ...t.typography.mono,
      color: t.color.roles.onSurfaceVariant,
    },
    cancelButton: {
      marginTop: t.spacing.sm,
    },
  });
}

export function FormLoadingOverlay({ phase, onCancel }: FormLoadingOverlayProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const label = phase ? PHASE_LABELS[phase] : PHASE_LABELS.total;

  return (
    <View style={styles.container} testID="form-loading-overlay">
      <ActivityIndicator size="large" color={theme.color.roles.primary} />
      <Text style={styles.phaseLabel}>{label}</Text>
      <Text style={styles.elapsed}>{elapsedSeconds}s</Text>
      <View style={styles.cancelButton}>
        <PressableButton
          testID="form-load-cancel"
          label="Cancelar"
          tone="error"
          onPress={onCancel}
        />
      </View>
    </View>
  );
}
