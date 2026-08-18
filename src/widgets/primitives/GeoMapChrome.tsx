/**
 * GeoMapChrome — shared map overlay chrome extracted from GeoPointWidget,
 * GeoTraceWidget, and GeoShapeWidget (design: Phase 3, decision 8).
 *
 * PR14 shipped a behavior-neutral extraction (raw `tokens`, flat
 * `rgba(0,0,0,*)` overlays). This PR (PR15) applies the target Campo/M3 look:
 * `MapActionButton` becomes a 48dp `roles.surface` circle at elevation 3 with
 * an `onSurface` icon (via `elevationStyle`); `GpsStatusPill`/
 * `PrewarmStatusPill` become `radius.pill` chips using `roles.surface`/
 * `roles.onSurface` with a 1px `outlineVariant` border for legibility over
 * variable map imagery, replacing the ad hoc `rgba(0,0,0,0.55)` scrim);
 * `GeoActionBar`'s Undo/Add-point/Accept/Cancel slots now render through the
 * shared `PressableButton` primitive instead of raw `Pressable` +
 * hardcoded colors. Every existing testID, `useGeoGps` interaction, and
 * prewarm/accept/undo/add-point LOGIC is untouched — visual chrome only.
 */
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { useThemedStyles, useTheme, type Theme } from '../../theme/ThemeContext';
import { elevationStyle } from '../../theme/elevationStyle';
import { PressableButton } from './PressableButton';
import { SafeAreaBottom } from './SafeAreaBottom';

export type GpsStatus = 'idle' | 'requesting' | 'acquiring' | 'tracking' | 'denied' | 'error';
export type PrewarmStatus = 'idle' | 'running' | 'done' | 'cap' | 'error';

function createStyles(t: Theme) {
  return StyleSheet.create({
    mapContainer: {
      flex: 1,
      width: '100%',
      borderRadius: t.radius.md,
      overflow: 'hidden',
    },
    actionButton: {
      position: 'absolute',
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...elevationStyle(t, 3),
    },
    actionButtonDisabled: {
      opacity: t.disabled.contentOpacity,
    },
    buttonText: {
      color: t.color.roles.onSurface,
      ...t.typography.labelLarge,
    },
    statusOverlay: {
      position: 'absolute',
      bottom: t.spacing.sm,
      left: t.spacing.sm,
      right: t.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderWidth: 1,
      borderColor: t.color.roles.outlineVariant,
    },
    statusText: {
      color: t.color.roles.onSurface,
      ...t.typography.bodySmall,
    },
    prewarmStatusOverlay: {
      position: 'absolute',
      bottom: t.spacing.sm + 44,
      left: t.spacing.sm,
      right: t.spacing.sm,
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderWidth: 1,
      borderColor: t.color.roles.outlineVariant,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: t.spacing.sm,
    },
    flexSlot: {
      flex: 1,
    },
  });
}

export interface GeoMapChromeProps {
  children: ReactNode;
}

/** Positioned overlay container wrapping the map canvas (mapContainer). */
export function GeoMapChrome({ children }: GeoMapChromeProps) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.mapContainer}>{children}</View>;
}

export interface MapActionButtonProps {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  /**
   * Positioning escape hatch: the recenter/prewarm buttons stack at
   * different `top` offsets. Call sites pass the exact absolute-position
   * values used before extraction/restyle.
   */
  style?: any;
}

export function MapActionButton({ icon, onPress, disabled, testID, style }: MapActionButtonProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionButton, disabled && styles.actionButtonDisabled, style]}
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
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
  if (status === 'idle') return null;
  return (
    <View style={styles.prewarmStatusOverlay} pointerEvents="none" testID={testID}>
      <Text style={styles.statusText}>
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
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  return (
    <SafeAreaBottom style={styles.buttonRow}>
      {undo && (
        <PressableButton
          label="Undo"
          onPress={undo.onPress}
          variant="text"
          tone="secondary"
          testID={undo.testID}
          theme={theme}
        />
      )}
      {addPoint && (
        <PressableButton
          label={addPoint.label ?? 'Agregar punto'}
          onPress={addPoint.onPress}
          variant="filled"
          tone="primary"
          disabled={addPoint.disabled}
          testID={addPoint.testID}
          theme={theme}
        />
      )}
      <View style={styles.flexSlot}>
        <PressableButton
          label="Accept"
          onPress={accept.onPress}
          variant="filled"
          tone="primary"
          fullWidth
          disabled={accept.disabled}
          testID={accept.testID}
          theme={theme}
        />
      </View>
      <View style={styles.flexSlot}>
        <PressableButton
          label="Cancel"
          onPress={cancel.onPress}
          variant="filled"
          tone="error"
          fullWidth
          disabled={cancel.disabled}
          testID={cancel.testID}
          theme={theme}
        />
      </View>
    </SafeAreaBottom>
  );
}
