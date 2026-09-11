"use strict";

/**
 * UnsupportedWidget — fallback surface (REQ-09).
 *
 * Rendered when isWidgetAvailable(dataType) returns false.
 * Displays the DataType label. Does not crash.
 * Usable standalone outside <Form>.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from "../theme/ThemeContext.js";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function UnsupportedWidget({
  dataType
}) {
  const styles = useThemedStyles(createStyles);
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "unsupported-widget",
    children: /*#__PURE__*/_jsxs(Text, {
      style: styles.label,
      children: ["Unsupported field type: ", dataType]
    })
  });
}
function createStyles(t) {
  return StyleSheet.create({
    container: {
      padding: t.spacing.md,
      backgroundColor: t.color.roles.errorContainer,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.roles.error
    },
    label: {
      ...t.typography.bodySmall,
      color: t.color.roles.onErrorContainer
    }
  });
}
//# sourceMappingURL=UnsupportedWidget.js.map