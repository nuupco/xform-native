"use strict";

/**
 * MediaCaptureCard — shared M3 media-capture chrome primitive (design
 * decision 7).
 *
 * Extracted from Image/Audio/Video/File/Barcode, which all render the
 * identical `container gap:sm` + button-row + `buttonText` triple across
 * 2-4 states each (~14 sites total). This PR (slice 10) ships the primitive
 * only — no existing widget consumes it yet; Image/File/Barcode wire in
 * PR11, Audio/Video in PR12.
 *
 * Action rendering reuses `PressableButton` (decision 11) so the
 * `tone:'error'` (Stop/Cancel), disabled-opacity, and ripple/press matrix
 * come for free instead of being re-implemented here.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from "../../theme/ThemeContext.js";
import { PressableButton } from "./PressableButton.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    container: {
      gap: t.spacing.sm
    },
    emptyState: {
      alignItems: 'center',
      gap: t.spacing.xs,
      padding: t.spacing.sm
    },
    title: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface
    },
    hint: {
      ...t.typography.bodySmall,
      color: t.color.roles.onSurfaceVariant
    },
    preview: {
      alignItems: 'center'
    },
    actionRow: {
      flexDirection: 'row',
      gap: t.spacing.sm
    },
    disabledContent: {
      opacity: t.disabled.contentOpacity
    }
  });
}

/**
 * `state:'captured'` renders only `preview` (falling back to nothing if the
 * caller forgot to pass one); `empty`/`active` render `icon`/`title`/`hint`.
 * Actions render in every state — capture flows (e.g. Audio's Stop button)
 * need actions available while `active`.
 */
export function MediaCaptureCard({
  state,
  icon,
  title,
  hint,
  actions,
  preview,
  disabled = false,
  testID
}) {
  const styles = useThemedStyles(createStyles);
  const isCaptured = state === 'captured';
  return /*#__PURE__*/_jsxs(View, {
    style: [styles.container, disabled && styles.disabledContent],
    testID: testID,
    children: [isCaptured ? /*#__PURE__*/_jsx(View, {
      style: styles.preview,
      children: preview
    }) : /*#__PURE__*/_jsxs(View, {
      style: styles.emptyState,
      children: [icon, /*#__PURE__*/_jsx(Text, {
        style: styles.title,
        children: title
      }), hint !== undefined && /*#__PURE__*/_jsx(Text, {
        style: styles.hint,
        children: hint
      })]
    }), actions.length > 0 && /*#__PURE__*/_jsx(View, {
      style: styles.actionRow,
      children: actions.map(action => /*#__PURE__*/_jsx(PressableButton, {
        label: action.label,
        onPress: action.onPress,
        variant: "text",
        tone: action.tone ?? 'primary',
        disabled: disabled || action.disabled,
        testID: action.testID
      }, action.testID ?? action.label))
    })]
  });
}
//# sourceMappingURL=MediaCaptureCard.js.map