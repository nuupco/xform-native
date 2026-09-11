"use strict";

/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles } from "../../theme/ThemeContext.js";
import { elevationStyle } from "../../theme/elevationStyle.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Panel is anchored to the bottom of the screen (overlay: justifyContent:
// 'flex-end'). Without a cap, a long options list (100+ choices) makes the
// panel grow taller than the screen; since it's bottom-anchored, the TOP of
// the panel (including the search box in minimal-autocomplete) is pushed
// off-screen with no way to scroll to it. Bounding height + wrapping
// children in a ScrollView keeps the whole panel on-screen with its own
// internal scroll.
const PANEL_MAX_HEIGHT_PERCENT = '75%';
function createStyles(t) {
  return StyleSheet.create({
    keyboardAvoiding: {
      flex: 1
    },
    overlay: {
      flex: 1,
      backgroundColor: t.color.roles.scrim,
      justifyContent: 'flex-end'
    },
    // design decision 11: surface + elevation 3 + radius.xl top corners.
    panel: {
      ...elevationStyle(t, 3, {
        direction: 'up'
      }),
      backgroundColor: t.color.roles.surface,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.xl,
      maxHeight: PANEL_MAX_HEIGHT_PERCENT
    },
    dragHandle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.color.roles.outlineVariant,
      marginBottom: t.spacing.sm
    }
  });
}
export function BottomSheet({
  visible,
  onClose,
  children,
  testID
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(Modal, {
    visible: visible,
    transparent: true,
    animationType: "slide",
    onRequestClose: onClose,
    children: /*#__PURE__*/_jsx(KeyboardAvoidingView, {
      testID: testID ? `${testID}-keyboard-avoiding` : undefined,
      style: styles.keyboardAvoiding,
      behavior: Platform.OS === 'ios' ? 'padding' : 'height',
      children: /*#__PURE__*/_jsx(Pressable, {
        style: styles.overlay,
        onPress: onClose,
        children: /*#__PURE__*/_jsxs(View, {
          style: styles.panel,
          testID: testID,
          children: [/*#__PURE__*/_jsx(View, {
            testID: testID ? `${testID}-drag-handle` : undefined,
            style: styles.dragHandle
          }), /*#__PURE__*/_jsx(ScrollView, {
            testID: testID ? `${testID}-scroll` : undefined,
            keyboardShouldPersistTaps: "handled",
            children: children
          })]
        })
      })
    })
  });
}
//# sourceMappingURL=BottomSheet.js.map