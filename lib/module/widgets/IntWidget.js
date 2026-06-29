"use strict";

/**
 * IntWidget — integer input (REQ-13).
 *
 * Parses input to integer via parseInt. NaN → does not call answerQuestion.
 */

import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { resolveVariant } from "./appearance.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function IntWidget({
  ref,
  store,
  appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const displayValue = value != null ? String(value) : '';
  resolveVariant('int', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  function handleChange(text) {
    if (isReadonly) return;
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      store.answerQuestion(ref, parsed);
    }
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [isRequired && /*#__PURE__*/_jsx(Text, {
      testID: "required-indicator",
      style: styles.required,
      children: "*"
    }), /*#__PURE__*/_jsx(TextInput, {
      testID: "int-input",
      style: [styles.input, isReadonly && styles.readonly],
      value: displayValue,
      onChangeText: handleChange,
      editable: !isReadonly,
      keyboardType: "number-pad"
    })]
  });
}
const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    fontSize: tokens.font.md,
    color: tokens.color.text,
    backgroundColor: tokens.color.background
  },
  readonly: {
    backgroundColor: tokens.color.surface
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=IntWidget.js.map