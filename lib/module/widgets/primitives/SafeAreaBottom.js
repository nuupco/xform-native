"use strict";

/**
 * SafeAreaBottom — bottom-safe-area padding for full-screen map modals.
 *
 * Gated on react-native-safe-area-context (optional peer dep, same pattern
 * as expo-location/maplibre-react-native in the geo widgets). Confirmed
 * on-device: the geo map modals' action buttons (Accept/Cancel/Undo) were
 * clipped by Android's gesture-navigation bar, since a full-screen RN
 * <Modal> does not account for system bar insets on its own. Falls back to
 * a fixed padding when the package is absent, so the button row is never
 * flush against the screen edge even without it.
 */

import { View } from 'react-native';
import { jsx as _jsx } from "react/jsx-runtime";
const FALLBACK_BOTTOM_INSET = 24;
let _safeAreaView = null;
let _loaded;
function getSafeAreaView() {
  if (_loaded === undefined) {
    try {
      _safeAreaView = require('react-native-safe-area-context').SafeAreaView;
      _loaded = true;
    } catch {
      _safeAreaView = null;
      _loaded = false;
    }
  }
  return _safeAreaView;
}
export function SafeAreaBottom({
  style,
  children
}) {
  const SafeAreaView = getSafeAreaView();
  if (SafeAreaView) {
    return /*#__PURE__*/_jsx(SafeAreaView, {
      edges: ['bottom'],
      style: style,
      children: children
    });
  }
  return /*#__PURE__*/_jsx(View, {
    style: [style, {
      paddingBottom: FALLBACK_BOTTOM_INSET
    }],
    children: children
  });
}
//# sourceMappingURL=SafeAreaBottom.js.map