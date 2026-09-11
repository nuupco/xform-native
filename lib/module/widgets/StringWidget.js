"use strict";

/**
 * StringWidget — renders a string/text input (REQ-13).
 *
 * Variants (ADR-3): default | multiline | numbers | url | masked
 *
 * `masked` obscures input as it's typed (RN's `secureTextEntry`, same as ODK
 * Collect's password-style InputType transformation). Per ODK Collect's
 * Appearances.isMasked(), 'numbers' always wins when both tokens are present
 * — see appearance.ts's resolveVariant.
 */

import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { resolveVariant } from "./engine/appearance.js";
import { useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { elevationStyle } from "../theme/elevationStyle.js";
import { jsx as _jsx } from "react/jsx-runtime";
// Multiline growth (spec: "Text Widgets (String/Long)" — min 3 lines, grows
// to ~8 lines before internal scroll). Derived from typography.bodyLarge's
// lineHeight so the cap tracks the theme rather than a magic number.
const MULTILINE_MIN_LINES = 3;
const MULTILINE_MAX_LINES = 8;
function createStyles(t) {
  const f = createFieldStyles(t);
  const lineHeight = t.typography.bodyLarge.lineHeight;
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    // Filled M3 field (design decision 2 worked example): fieldStyles' box
    // spread, restyled to top-corners-only radius over a surfaceVariant fill
    // (spec: "surfaceVariant bg, top-corners-only radius, 1px outline underline").
    input: {
      ...f.field,
      ...f.fieldText,
      backgroundColor: t.color.roles.surfaceVariant,
      borderTopLeftRadius: t.radius.md,
      borderTopRightRadius: t.radius.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    inputMultiline: {
      minHeight: lineHeight * MULTILINE_MIN_LINES,
      maxHeight: lineHeight * MULTILINE_MAX_LINES,
      textAlignVertical: 'top'
    },
    focused: {
      ...f.fieldFocused,
      ...elevationStyle(t, 2)
    },
    readonly: {
      ...f.fieldDisabled,
      borderWidth: 0
    }
  });
}
export function StringWidget({
  nodeRef,
  store,
  appearance
}) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [focused, setFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const displayValue = value != null ? String(value) : '';
  const variant = resolveVariant('string', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  function handleChange(text) {
    if (isReadonly) return;
    store.answerQuestion(nodeRef, text);
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsx(TextInput, {
      testID: "string-input",
      style: [styles.input, variant === 'multiline' && styles.inputMultiline, focused && !isReadonly && styles.focused, isReadonly && styles.readonly],
      value: displayValue,
      onChangeText: handleChange,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      editable: !isReadonly,
      multiline: variant === 'multiline',
      keyboardType: variant === 'numbers' ? 'numeric' : variant === 'url' ? 'url' : 'default',
      secureTextEntry: variant === 'masked',
      autoCapitalize: "none"
    })
  });
}
//# sourceMappingURL=StringWidget.js.map