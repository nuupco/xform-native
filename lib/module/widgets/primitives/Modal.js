"use strict";

/**
 * AppModal — StyleSheet layout primitive (REQ-18).
 *
 * Wraps React Native core Modal with design-token styling.
 * No WebView, no third-party layout library. RN-core only.
 */

import { Modal, View, StyleSheet } from 'react-native';
import { useThemedStyles } from "../../theme/ThemeContext.js";
import { jsx as _jsx } from "react/jsx-runtime";
function createStyles(t) {
  return StyleSheet.create({
    // RN 0.85 Fabric: padding must not share a node with centering/minWidth (collapses Text)
    // Edge inset lives on an inner wrapper so the centering node carries no padding.
    overlay: {
      flex: 1,
      backgroundColor: t.color.roles.scrim,
      justifyContent: 'center',
      alignItems: 'center'
    },
    inset: {
      width: '100%',
      padding: t.spacing.md
    },
    fullScreenOverlay: {
      flex: 1,
      backgroundColor: 'black'
    }
  });
}
export function AppModal({
  visible,
  onRequestClose,
  testID,
  style,
  children,
  animationType = 'fade',
  fullScreen = false
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(Modal, {
    visible: visible,
    transparent: true,
    animationType: animationType,
    onRequestClose: onRequestClose,
    children: /*#__PURE__*/_jsx(View, {
      testID: testID,
      style: [fullScreen ? styles.fullScreenOverlay : styles.overlay, style],
      children: fullScreen ? children : /*#__PURE__*/_jsx(View, {
        style: styles.inset,
        children: children
      })
    })
  });
}
//# sourceMappingURL=Modal.js.map