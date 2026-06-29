"use strict";

/**
 * BottomSheet — StyleSheet layout primitive (REQ-18).
 *
 * Layout pattern ported from expo-enketo-form's BottomSheetPicker:
 *   transparent Modal + bottom-anchored panel (justifyContent: 'flex-end').
 * Layout only — no bridge logic, no Expo deps, RN-core only.
 */

import { Modal, Pressable, StyleSheet } from 'react-native';
import { tokens } from "../../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function BottomSheet({
  visible,
  onClose,
  children,
  testID
}) {
  return /*#__PURE__*/_jsx(Modal, {
    visible: visible,
    transparent: true,
    animationType: "slide",
    onRequestClose: onClose,
    children: /*#__PURE__*/_jsx(Pressable, {
      style: styles.overlay,
      onPress: onClose,
      children: /*#__PURE__*/_jsx(Pressable, {
        style: styles.panel,
        testID: testID,
        onPress: () => {},
        children: children
      })
    })
  });
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  panel: {
    backgroundColor: tokens.color.background,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl
  }
});
//# sourceMappingURL=BottomSheet.js.map