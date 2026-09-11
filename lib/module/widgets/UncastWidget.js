"use strict";

/**
 * UncastWidget — fallback for uncast/unsupported/unknown DataType (REQ-16).
 *
 * Displays raw string value if available. Does not crash.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function UncastWidget({
  nodeRef,
  store
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
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
function createStyles(t) {
  return StyleSheet.create({
    container: {
      padding: t.spacing.md,
      backgroundColor: t.color.roles.surfaceVariant,
      borderRadius: t.radius.sm,
      marginVertical: t.spacing.xs
    },
    value: {
      ...t.typography.mono,
      color: t.color.roles.onSurfaceVariant
    }
  });
}
//# sourceMappingURL=UncastWidget.js.map