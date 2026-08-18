/**
 * GeoMapChrome — shared map overlay chrome extracted from GeoPointWidget,
 * GeoTraceWidget, and GeoShapeWidget (design: Phase 3, decision 8).
 *
 * This PR is a BEHAVIOR-NEUTRAL EXTRACTION ONLY: every visual value here
 * (colors, sizes, positions, copy) is copied verbatim from the three widgets'
 * near-identical style blocks. The M3-themed look (surface/elevation/onSurface)
 * described in the design doc's target state ships in the *next* PR (PR15) —
 * do not restyle here.
 */
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { tokens } from '../../tokens/tokens';
import { SafeAreaBottom } from './SafeAreaBottom';

export type GpsStatus = 'idle' | 'requesting' | 'acquiring' | 'tracking' | 'denied' | 'error';
export type PrewarmStatus = 'idle' | 'running' | 'done' | 'cap' | 'error';

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  actionButton: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.sm,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    left: tokens.spacing.sm,
    right: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.xs,
  },
  statusText: {
    color: '#fff',
    fontSize: tokens.font.sm,
  },
  prewarmStatusOverlay: {
    position: 'absolute',
    bottom: tokens.spacing.sm + 44,
    left: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
  },
  acceptButton: {
    backgroundColor: tokens.color.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: tokens.color.error,
    flex: 1,
  },
  undoButton: {
    backgroundColor: tokens.color.surface,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});

export interface GeoMapChromeProps {
  children: ReactNode;
}

/** Positioned overlay container wrapping the map canvas (mapContainer). */
export function GeoMapChrome({ children }: GeoMapChromeProps) {
  return <View style={styles.mapContainer}>{children}</View>;
}

export interface MapActionButtonProps {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  /**
   * Extraction-only positioning escape hatch: the recenter/prewarm buttons
   * currently stack at different `top` offsets. The themed PR15 primitive
   * may replace this with a variant prop; for now the call sites pass the
   * exact same absolute-position values used before extraction.
   */
  style?: any;
}

export function MapActionButton({ icon, onPress, disabled, testID, style }: MapActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionButton, style]}
      testID={testID}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{icon}</Text>
    </Pressable>
  );
}

export interface GpsStatusPillProps {
  status: GpsStatus;
  accuracyM?: number;
  testID?: string;
}

export function GpsStatusPill({ status, accuracyM, testID }: GpsStatusPillProps) {
  return (
    <View style={styles.statusOverlay} pointerEvents="none" testID={testID}>
      {(status === 'requesting' || status === 'acquiring') && (
        <ActivityIndicator size="small" />
      )}
      <Text style={styles.statusText}>
        {status === 'denied'
          ? 'Sin permiso de ubicación'
          : status === 'error'
            ? 'No se pudo obtener la ubicación'
            : status === 'tracking' && accuracyM !== undefined
              ? `GPS ±${accuracyM.toFixed(1)} m`
              : 'Adquiriendo señal GPS…'}
      </Text>
    </View>
  );
}

export interface PrewarmStatusPillProps {
  status: PrewarmStatus;
  testID?: string;
}

export function PrewarmStatusPill({ status, testID }: PrewarmStatusPillProps) {
  if (status === 'idle') return null;
  return (
    <View style={styles.prewarmStatusOverlay} pointerEvents="none">
      <Text style={styles.statusText} testID={testID}>
        {status === 'running'
          ? 'Descargando mapas sin conexión…'
          : status === 'cap'
            ? 'Límite de almacenamiento alcanzado'
            : status === 'error'
              ? 'No se pudieron descargar los mapas'
              : 'Mapas descargados para uso sin conexión'}
      </Text>
    </View>
  );
}

export interface GeoActionSlot {
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

export interface GeoActionBarProps {
  undo?: GeoActionSlot;
  addPoint?: GeoActionSlot & { label?: string };
  accept: GeoActionSlot;
  cancel: GeoActionSlot;
}

export function GeoActionBar({ undo, addPoint, accept, cancel }: GeoActionBarProps) {
  return (
    <SafeAreaBottom style={styles.buttonRow}>
      {undo && (
        <Pressable
          onPress={undo.onPress}
          style={[styles.button, styles.undoButton]}
          testID={undo.testID}
        >
          <Text style={styles.buttonText}>Undo</Text>
        </Pressable>
      )}
      {addPoint && (
        <Pressable
          onPress={addPoint.disabled ? undefined : addPoint.onPress}
          style={[styles.button, styles.undoButton, addPoint.disabled && styles.buttonDisabled]}
          disabled={addPoint.disabled}
          testID={addPoint.testID}
        >
          <Text style={styles.buttonText}>{addPoint.label ?? 'Agregar punto'}</Text>
        </Pressable>
      )}
      <Pressable
        onPress={accept.disabled ? undefined : accept.onPress}
        style={[styles.button, styles.acceptButton, accept.disabled && styles.buttonDisabled]}
        disabled={accept.disabled}
        testID={accept.testID}
      >
        <Text style={styles.buttonText}>Accept</Text>
      </Pressable>
      <Pressable
        onPress={cancel.onPress}
        style={[styles.button, styles.cancelButton]}
        testID={cancel.testID}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
    </SafeAreaBottom>
  );
}
