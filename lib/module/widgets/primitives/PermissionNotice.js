"use strict";

/**
 * PermissionNotice — shared presentational permission card (Phase 6,
 * design decisions 5-6).
 *
 * Reuses `GpsPermissionNotice`'s visual language (`roles.surface`,
 * `radius.md`, `elevationStyle(t,3)`, `outlineVariant` border,
 * `titleSmall`/`bodySmall`, `PressableButton` actions) but is a plain
 * inline card (flow layout, not absolutely positioned) — media widgets
 * aren't map overlays. It is rendered by each widget through
 * `MediaCaptureCard`'s existing `preview` slot with `state='captured'`, so
 * this component needs no knowledge of `MediaCaptureCard` itself.
 *
 * Unlike `GpsPermissionNotice`, copy is fully prop-driven rather than
 * status-derived: several distinct permission kinds (camera, microphone,
 * photo library) consume this one component with their own title/body/
 * action copy, so a status→copy switch here would have to know about all
 * of them (design decision 6).
 */
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, useTheme } from "../../theme/ThemeContext.js";
import { elevationStyle } from "../../theme/elevationStyle.js";
import { PressableButton } from "./PressableButton.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.roles.outlineVariant,
      padding: t.spacing.md,
      gap: t.spacing.xs,
      ...elevationStyle(t, 3)
    },
    title: {
      color: t.color.roles.onSurface,
      ...t.typography.titleSmall
    },
    body: {
      color: t.color.roles.onSurfaceVariant,
      ...t.typography.bodySmall
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: t.spacing.sm,
      marginTop: t.spacing.xs
    }
  });
}
/**
 * Dismiss renders only when both `dismissLabel` and `onDismiss` are given
 * (design decision 6) — omitted for e.g. `blocked` copy, which has no
 * "not now" affordance.
 */
export function PermissionNotice({
  title,
  body,
  primaryLabel,
  onPrimary,
  dismissLabel,
  onDismiss,
  testID = 'permission-notice'
}) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const showDismiss = Boolean(dismissLabel && onDismiss);
  return /*#__PURE__*/_jsxs(View, {
    style: styles.card,
    testID: testID,
    children: [/*#__PURE__*/_jsx(Text, {
      style: styles.title,
      children: title
    }), /*#__PURE__*/_jsx(Text, {
      style: styles.body,
      children: body
    }), /*#__PURE__*/_jsxs(View, {
      style: styles.actions,
      children: [showDismiss && /*#__PURE__*/_jsx(PressableButton, {
        label: dismissLabel,
        onPress: onDismiss,
        variant: "text",
        tone: "secondary",
        testID: `${testID}-dismiss`,
        theme: theme
      }), /*#__PURE__*/_jsx(PressableButton, {
        label: primaryLabel,
        onPress: onPrimary,
        variant: "filled",
        tone: "primary",
        testID: `${testID}-primary`,
        theme: theme
      })]
    })]
  });
}
//# sourceMappingURL=PermissionNotice.js.map