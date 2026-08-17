import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FormLoadPhase } from '@nuup/xform-native';

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

export function FormLoadingOverlay({ phase, onCancel }: FormLoadingOverlayProps) {
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
      <ActivityIndicator size="large" color="#1976d2" />
      <Text style={styles.phaseLabel}>{label}</Text>
      <Text style={styles.elapsed}>{elapsedSeconds}s</Text>
      <TouchableOpacity
        testID="form-load-cancel"
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  phaseLabel: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  elapsed: {
    fontSize: 14,
    color: '#888',
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: '#c0392b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
