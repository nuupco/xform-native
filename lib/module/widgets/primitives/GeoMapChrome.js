"use strict";

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
import { useThemedStyles, useTheme } from "../../theme/ThemeContext.js";
import { elevationStyle } from "../../theme/elevationStyle.js";
import { PressableButton } from "./PressableButton.js";
import { SafeAreaBottom } from "./SafeAreaBottom.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    mapContainer: {
      flex: 1,
      width: '100%',
      borderRadius: t.radius.md,
      overflow: 'hidden'
    },
    actionButton: {
      position: 'absolute',
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...elevationStyle(t, 3)
    },
    actionButtonDisabled: {
      opacity: t.disabled.contentOpacity
    },
    buttonText: {
      color: t.color.roles.onSurface,
      ...t.typography.labelLarge
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
      borderColor: t.color.roles.outlineVariant
    },
    statusText: {
      color: t.color.roles.onSurface,
      ...t.typography.bodySmall
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
      borderColor: t.color.roles.outlineVariant
    },
    buttonRow: {
      flexDirection: 'row',
      gap: t.spacing.sm
    },
    flexSlot: {
      flex: 1
    },
    noticeOverlay: {
      position: 'absolute',
      bottom: t.spacing.sm,
      left: t.spacing.sm,
      right: t.spacing.sm,
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.roles.outlineVariant,
      padding: t.spacing.md,
      gap: t.spacing.xs,
      ...elevationStyle(t, 3)
    },
    noticeTitle: {
      color: t.color.roles.onSurface,
      ...t.typography.titleSmall
    },
    noticeBody: {
      color: t.color.roles.onSurfaceVariant,
      ...t.typography.bodySmall
    },
    noticeActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: t.spacing.sm,
      marginTop: t.spacing.xs
    }
  });
}
/** Positioned overlay container wrapping the map canvas (mapContainer). */
export function GeoMapChrome({
  children
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(View, {
    style: styles.mapContainer,
    children: children
  });
}
export function MapActionButton({
  icon,
  onPress,
  disabled,
  testID,
  style
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(Pressable, {
    onPress: onPress,
    style: [styles.actionButton, disabled && styles.actionButtonDisabled, style],
    testID: testID,
    disabled: disabled,
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.buttonText,
      children: icon
    })
  });
}
export function GpsStatusPill({
  status,
  accuracyM,
  testID
}) {
  const styles = useThemedStyles(createStyles);
  if (status === 'rationale' || status === 'blocked') return null;
  return /*#__PURE__*/_jsxs(View, {
    style: styles.statusOverlay,
    pointerEvents: "none",
    testID: testID,
    children: [(status === 'requesting' || status === 'acquiring') && /*#__PURE__*/_jsx(ActivityIndicator, {
      size: "small"
    }), /*#__PURE__*/_jsx(Text, {
      style: styles.statusText,
      children: status === 'denied' ? 'Sin permiso de ubicación' : status === 'error' ? 'No se pudo obtener la ubicación' : status === 'tracking' && accuracyM !== undefined ? `GPS ±${accuracyM.toFixed(1)} m` : 'Adquiriendo señal GPS…'
    })]
  });
}
export function PrewarmStatusPill({
  status,
  testID
}) {
  const styles = useThemedStyles(createStyles);
  if (status === 'idle') return null;
  return /*#__PURE__*/_jsx(View, {
    style: styles.prewarmStatusOverlay,
    pointerEvents: "none",
    testID: testID,
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.statusText,
      children: status === 'running' ? 'Descargando mapas sin conexión…' : status === 'cap' ? 'Límite de almacenamiento alcanzado' : status === 'error' ? 'No se pudieron descargar los mapas' : 'Mapas descargados para uso sin conexión'
    })
  });
}
/**
 * GpsPermissionNotice — pressable card overlay shown instead of
 * GpsStatusPill when status is `rationale`/`denied`/`blocked` (design
 * decisions 5-7, 12). Not a Modal/BottomSheet: the map lives inside an
 * already-open full-screen AppModal, so nesting another Modal here would be
 * illegal.
 */
export function GpsPermissionNotice({
  status,
  onRequestPermission,
  onDismiss,
  onOpenSettings,
  fallbackHint,
  testID
}) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  let copy;
  if (status === 'rationale') {
    copy = {
      title: 'Usar tu ubicación',
      body: 'Necesitamos el GPS para ubicar tu punto en el mapa. Solo se usa mientras este mapa está abierto.',
      primaryLabel: 'Permitir ubicación',
      onPrimary: onRequestPermission,
      showDismiss: true
    };
  } else if (status === 'blocked') {
    copy = {
      title: 'Permiso de ubicación bloqueado',
      body: 'Actívalo en los ajustes del sistema para usar el GPS.',
      primaryLabel: 'Abrir ajustes',
      onPrimary: onOpenSettings,
      showDismiss: false
    };
  } else {
    copy = {
      title: 'Sin permiso de ubicación',
      body: 'Permite el acceso para ver tu posición en el mapa.',
      primaryLabel: 'Permitir ubicación',
      onPrimary: onRequestPermission,
      showDismiss: true
    };
  }
  const body = fallbackHint && status !== 'rationale' ? `${copy.body} ${fallbackHint}` : copy.body;
  return /*#__PURE__*/_jsxs(View, {
    style: styles.noticeOverlay,
    testID: testID,
    children: [/*#__PURE__*/_jsx(Text, {
      style: styles.noticeTitle,
      children: copy.title
    }), /*#__PURE__*/_jsx(Text, {
      style: styles.noticeBody,
      children: body
    }), /*#__PURE__*/_jsxs(View, {
      style: styles.noticeActions,
      children: [copy.showDismiss && /*#__PURE__*/_jsx(PressableButton, {
        label: "Ahora no",
        onPress: onDismiss,
        variant: "text",
        tone: "secondary",
        testID: "gps-permission-dismiss",
        theme: theme
      }), /*#__PURE__*/_jsx(PressableButton, {
        label: copy.primaryLabel,
        onPress: copy.onPrimary,
        variant: "filled",
        tone: "primary",
        testID: "gps-permission-primary",
        theme: theme
      })]
    })]
  });
}
export function GeoActionBar({
  undo,
  addPoint,
  accept,
  cancel
}) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  return /*#__PURE__*/_jsxs(SafeAreaBottom, {
    style: styles.buttonRow,
    children: [undo && /*#__PURE__*/_jsx(PressableButton, {
      label: "Undo",
      onPress: undo.onPress,
      variant: "text",
      tone: "secondary",
      testID: undo.testID,
      theme: theme
    }), addPoint && /*#__PURE__*/_jsx(PressableButton, {
      label: addPoint.label ?? 'Agregar punto',
      onPress: addPoint.onPress,
      variant: "filled",
      tone: "primary",
      disabled: addPoint.disabled,
      testID: addPoint.testID,
      theme: theme
    }), /*#__PURE__*/_jsx(View, {
      style: styles.flexSlot,
      children: /*#__PURE__*/_jsx(PressableButton, {
        label: "Accept",
        onPress: accept.onPress,
        variant: "filled",
        tone: "primary",
        fullWidth: true,
        disabled: accept.disabled,
        testID: accept.testID,
        theme: theme
      })
    }), /*#__PURE__*/_jsx(View, {
      style: styles.flexSlot,
      children: /*#__PURE__*/_jsx(PressableButton, {
        label: "Cancel",
        onPress: cancel.onPress,
        variant: "filled",
        tone: "error",
        fullWidth: true,
        disabled: cancel.disabled,
        testID: cancel.testID,
        theme: theme
      })
    })]
  });
}
//# sourceMappingURL=GeoMapChrome.js.map