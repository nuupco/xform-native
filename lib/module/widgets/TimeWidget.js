"use strict";

/**
 * TimeWidget — renders a time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with HH:MM validation.
 *
 * Value shape (ts-rosa codecs.ts:162-169, AnswerValue.ts:28):
 *   time value = Date object anchored to epoch (1970-01-01).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: HH:MM (UTC hours/minutes from the Date value).
 */

import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { tokens } from "../tokens/tokens.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Format a Date as UTC HH:MM string for display. */
function formatTimeDisplay(d) {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Parse HH:MM to a Date anchored on epoch, returns null if invalid. */
function parseTimeInput(text) {
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date(`1970-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
  if (isNaN(d.getTime())) return null;
  return d;
}
export function TimeWidget({
  ref,
  store,
  appearance: _appearance
}) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;
  let displayValue = '';
  if (value instanceof Date) {
    displayValue = formatTimeDisplay(value);
  } else if (typeof value === 'string' && value !== '') {
    displayValue = value;
  }
  function handleChange(text) {
    if (isReadonly) return;
    const parsed = parseTimeInput(text);
    if (parsed !== null) {
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
      testID: "time-input",
      style: [styles.input, isReadonly && styles.readonly],
      value: displayValue,
      onChangeText: handleChange,
      editable: !isReadonly,
      placeholder: "HH:MM",
      keyboardType: "numeric",
      maxLength: 5,
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
//# sourceMappingURL=TimeWidget.js.map