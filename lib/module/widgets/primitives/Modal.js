"use strict";

/**
 * AppModal — StyleSheet layout primitive (REQ-18).
 *
 * Wraps React Native core Modal with design-token styling.
 * No WebView, no third-party layout library. RN-core only.
 */

import { Modal, View, StyleSheet } from 'react-native';
import { tokens } from "../../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function AppModal({
  visible,
  onRequestClose,
  testID,
  style,
  children,
  animationType = 'fade'
}) {
  return /*#__PURE__*/_jsx(Modal, {
    visible: visible,
    transparent: true,
    animationType: animationType,
    onRequestClose: onRequestClose,
    children: /*#__PURE__*/_jsx(View, {
      testID: testID,
      style: [styles.overlay, style],
      children: children
    })
  });
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,0.45)`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.md
  }
});
//# sourceMappingURL=Modal.js.map