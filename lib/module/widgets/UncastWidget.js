"use strict";

/**
 * UncastWidget — fallback for uncast/unsupported/unknown DataType (REQ-16).
 *
 * Displays raw string value if available. Does not crash.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function UncastWidget({
  ref,
  store
}) {
  useFormSession(store);
  const value = store.adapter.resolveValue(ref);
  const displayValue = value != null ? String(value) : '';
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "uncast-widget",
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.value,
      children: displayValue
    })
  });
}
const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    marginVertical: tokens.spacing.xs
  },
  value: {
    fontSize: tokens.font.md,
    color: tokens.color.text
  }
});
//# sourceMappingURL=UncastWidget.js.map