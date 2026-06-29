"use strict";

/**
 * NoteWidget — read-only display of note text (REQ-15).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(ref).
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function NoteWidget({
  ref,
  store
}) {
  useFormSession(store);
  const value = store.adapter.resolveValue(ref);
  const text = value != null ? String(value) : '';
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    testID: "note-widget",
    children: /*#__PURE__*/_jsx(Text, {
      style: styles.text,
      children: text
    })
  });
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    marginVertical: tokens.spacing.xs
  },
  text: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    fontStyle: 'italic'
  }
});
//# sourceMappingURL=NoteWidget.js.map