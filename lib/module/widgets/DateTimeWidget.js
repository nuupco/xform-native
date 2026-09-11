"use strict";

/**
 * DateTimeWidget — renders a date+time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with YYYY-MM-DDTHH:MM validation.
 *
 * Value shape (ts-rosa codecs.ts:172-176, AnswerValue.ts:29):
 *   dateTime value = Date object (full ISO 8601 timestamp).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: YYYY-MM-DDTHH:MM (UTC).
 */

import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useTheme, useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { CalendarIcon } from "./primitives/Icon.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function createStyles(t) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs
    },
    row: f.fieldRow,
    input: {
      ...f.field,
      ...f.fieldNumeric,
      flex: 1
    },
    focused: f.fieldFocused,
    readonly: f.fieldDisabled,
    pickerAffordance: f.fieldAffordance
  });
}
/** Format a Date as UTC YYYY-MM-DDTHH:MM string for display. */
function formatDateTimeDisplay(d) {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${m}`;
}

/** Parse YYYY-MM-DDTHH:MM to a Date, returns null if invalid. */
function parseDateTimeInput(text) {
  // Accept "YYYY-MM-DDTHH:MM" or "YYYY-MM-DD HH:MM"
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00.000Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}
export function DateTimeWidget({
  nodeRef,
  store,
  appearance: _appearance
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const isReadonly = nodeState?.readonly ?? false;
  let displayValue = '';
  if (value instanceof Date) {
    displayValue = formatDateTimeDisplay(value);
  } else if (typeof value === 'string' && value !== '') {
    displayValue = value;
  }
  function handleChange(text) {
    if (isReadonly) return;
    const parsed = parseDateTimeInput(text);
    if (parsed !== null) {
      store.answerQuestion(nodeRef, parsed);
    }
  }
  return /*#__PURE__*/_jsx(View, {
    style: styles.container,
    children: /*#__PURE__*/_jsxs(View, {
      style: styles.row,
      children: [/*#__PURE__*/_jsx(TextInput, {
        testID: "datetime-input",
        style: [styles.input, focused && styles.focused, isReadonly && styles.readonly],
        value: displayValue,
        onChangeText: handleChange,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        editable: !isReadonly,
        placeholder: "YYYY-MM-DDTHH:MM",
        placeholderTextColor: theme.color.roles.onSurfaceVariant,
        keyboardType: "default",
        maxLength: 16,
        autoCapitalize: "none"
      }), /*#__PURE__*/_jsx(View, {
        style: styles.pickerAffordance,
        children: /*#__PURE__*/_jsx(CalendarIcon, {
          testID: "datetime-picker-icon",
          color: theme.color.roles.primary,
          theme: theme
        })
      })]
    })
  });
}
//# sourceMappingURL=DateTimeWidget.js.map