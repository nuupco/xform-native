"use strict";

/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url
 */

import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { resolveVariant } from "./appearance.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StringWidget({
  ref,
  store,
  appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const displayValue = value != null ? String(value) : '';
  const variant = resolveVariant('string', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  function handleChange(text) {
    if (isReadonly) return;
    store.answerQuestion(ref, text);
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [isRequired && /*#__PURE__*/_jsx(Text, {
      testID: "required-indicator",
      style: styles.required,
      children: "*"
    }), /*#__PURE__*/_jsx(TextInput, {
      testID: "string-input",
      style: [styles.input, isReadonly && styles.readonly],
      value: displayValue,
      onChangeText: handleChange,
      editable: !isReadonly,
      multiline: variant === 'multiline',
      keyboardType: variant === 'numbers' ? 'numeric' : variant === 'url' ? 'url' : 'default',
      autoCapitalize: "none"
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
    backgroundColor: tokens.color.surface,
    color: tokens.color.text
  },
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm
  }
});
//# sourceMappingURL=StringWidget.js.map