"use strict";

/**
 * surfaces.tsx — bof / eof / required / constraint / label-hint display components.
 *
 * ADR-2: these are pure presentational components with no store dependency.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BofSurface({
  onStart
}) {
  return /*#__PURE__*/_jsxs(View, {
    style: styles.center,
    testID: "bof-surface",
    children: [/*#__PURE__*/_jsx(Text, {
      style: styles.title,
      children: "Beginning of Form"
    }), /*#__PURE__*/_jsx(Pressable, {
      onPress: onStart,
      testID: "bof-start-button",
      style: styles.button,
      children: /*#__PURE__*/_jsx(Text, {
        style: styles.buttonText,
        children: "Start"
      })
    })]
  });
}
export function EofSurface() {
  return /*#__PURE__*/_jsx(View, {
    style: styles.center,
    testID: "eof-surface",
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.title,
      children: "Form Complete"
    })
  });
}
export function ConstraintSurface({
  message
}) {
  return /*#__PURE__*/_jsx(View, {
    testID: "constraint-message",
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.error,
      children: message
    })
  });
}
export function RequiredSurface() {
  return /*#__PURE__*/_jsx(View, {
    testID: "required-message",
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.error,
      children: "This field is required"
    })
  });
}
export function LabelHint({
  label,
  hint
}) {
  return /*#__PURE__*/_jsxs(View, {
    children: [label !== null && /*#__PURE__*/_jsx(Text, {
      testID: "question-label",
      style: styles.label,
      children: label
    }), hint !== null && /*#__PURE__*/_jsx(Text, {
      testID: "question-hint",
      style: styles.hint,
      children: hint
    })]
  });
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg
  },
  title: {
    fontSize: tokens.font.lg,
    fontWeight: 'bold',
    color: tokens.color.text
  },
  button: {
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md
  },
  buttonText: {
    color: tokens.color.background,
    fontSize: tokens.font.md
  },
  error: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
    marginTop: tokens.spacing.xs
  },
  label: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    marginBottom: tokens.spacing.xs
  },
  hint: {
    fontSize: tokens.font.sm,
    color: tokens.color.text,
    marginBottom: tokens.spacing.sm
  }
});
//# sourceMappingURL=surfaces.js.map