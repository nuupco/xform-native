"use strict";

/**
 * BooleanWidget — boolean input (REQ-13).
 *
 * Variants (ADR-3):
 *   default → Switch
 *   checkbox → Pressable checkbox (custom, no native module)
 */

import { View, Switch, Pressable, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { resolveVariant } from "./appearance.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BooleanWidget({
  ref,
  store,
  appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const boolValue = value === true || value === 'true' || value === '1';
  const variant = resolveVariant('boolean', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  function handleChange(newValue) {
    if (isReadonly) return;
    store.answerQuestion(ref, newValue);
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [isRequired && /*#__PURE__*/_jsx(Text, {
      testID: "required-indicator",
      style: styles.required,
      children: "*"
    }), variant === 'checkbox' ? /*#__PURE__*/_jsx(Pressable, {
      testID: "boolean-checkbox",
      style: [styles.checkbox, boolValue && styles.checkboxChecked, isReadonly && styles.disabled],
      onPress: () => handleChange(!boolValue),
      accessibilityRole: "checkbox",
      accessibilityState: {
        checked: boolValue,
        disabled: isReadonly
      },
      children: boolValue && /*#__PURE__*/_jsx(Text, {
        style: styles.checkmark,
        children: "\u2713"
      })
    }) : /*#__PURE__*/_jsx(Switch, {
      testID: "boolean-switch",
      value: boolValue,
      onValueChange: handleChange,
      disabled: isReadonly,
      trackColor: {
        true: tokens.color.primary
      }
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary
  },
  checkmark: {
    color: tokens.color.background,
    fontSize: tokens.font.md
  },
  disabled: {
    opacity: 0.5
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=BooleanWidget.js.map