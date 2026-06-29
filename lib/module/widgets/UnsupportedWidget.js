"use strict";

/**
 * UnsupportedWidget — fallback surface (REQ-09).
 *
 * Rendered when isWidgetAvailable(dataType) returns false.
 * Displays the DataType label. Does not crash.
 * Usable standalone outside <Form>.
 */

import { View, Text, StyleSheet } from 'react-native';
import { tokens } from "../tokens/tokens.js";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function UnsupportedWidget({
  dataType
}) {
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "unsupported-widget",
    children: /*#__PURE__*/_jsxs(Text, {
      style: styles.label,
      children: ["Unsupported field type: ", dataType]
    })
  });
}
const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.error
  },
  label: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=UnsupportedWidget.js.map