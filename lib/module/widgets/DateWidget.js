"use strict";

/**
 * DateWidget — renders a date entry field (REQ-13).
 *
 * RN-core only by default — no hard dependency on
 * @react-native-community/datetimepicker (ZERO native deps constraint). Entry
 * via formatted TextInput with mask/validation.
 *
 * @react-native-community/datetimepicker is an OPTIONAL peer dep (same gating
 * pattern as expo-image-picker in ImageWidget.tsx). Unlike ImageWidget, the
 * manual TextInput is never replaced when the dep is absent — it's the
 * baseline that already works. When the dep IS present, the `default` variant
 * (full YYYY-MM-DD) additionally renders a button that opens the native date
 * picker alongside the TextInput. `month-year` and `year` variants have no
 * standard native picker equivalent and are unaffected.
 *
 * Value shape (ts-rosa codecs.ts:153-158, AnswerValue.ts:27):
 *   date value = Date object (UTC midnight for the given date).
 *   store.answerQuestion receives a Date directly.
 *
 * Variants (ADR-3 date):
 *   default     → full YYYY-MM-DD TextInput (+ native picker button when available)
 *   month-year  → MM-YYYY entry, stored as Date with day=1
 *   year        → YYYY entry, stored as Date with month=1, day=1
 *   no-calendar → full YYYY-MM-DD TextInput, same as default, but NEVER
 *                 renders the native picker button (spec: text entry only,
 *                 no calendar UI at all, even when the optional peer dep is
 *                 present)
 *   buddhist, coptic, ethiopian, islamic, persian → YYYY-MM-DD TextInput,
 *                 same mask/shape as default, but the digits are read/shown
 *                 in that calendar system instead of Gregorian. The stored
 *                 value is still a Gregorian UTC Date (ODK Collect's own
 *                 pickers for these appearances are display/edit-only too —
 *                 see calendars.ts docblock for the conversion sources).
 *                 No native picker equivalent exists for these, same as
 *                 month-year/year.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { useFormSession } from "../store/useFormSession.js";
import { useTheme, useThemedStyles } from "../theme/ThemeContext.js";
import { createFieldStyles } from "./primitives/fieldStyles.js";
import { CalendarIcon } from "./primitives/Icon.js";
import { resolveVariant } from "./engine/appearance.js";
import { gregorianToBuddhist, buddhistToGregorian, gregorianToCoptic, copticToGregorian, gregorianToEthiopian, ethiopianToGregorian, gregorianToIslamic, islamicToGregorian, gregorianToPersian, persianToGregorian } from "./calendars.js";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    pickerButton: f.fieldAffordance,
    pickerDoneButton: {
      alignSelf: 'flex-end',
      paddingVertical: t.spacing.xs,
      paddingHorizontal: t.spacing.sm
    },
    pickerDoneText: {
      color: t.color.roles.primary,
      fontWeight: '600'
    }
  });
}
let _DateTimePicker = null;
let _pickerLoaded;
function getDateTimePicker() {
  if (_pickerLoaded === undefined) {
    try {
      _DateTimePicker = require('@react-native-community/datetimepicker').default;
      _pickerLoaded = true;
    } catch {
      _DateTimePicker = null;
      _pickerLoaded = false;
    }
  }
  return _DateTimePicker;
}
/** Format a Date as UTC YYYY-MM-DD string for display. */
function formatDateDisplay(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string to a UTC Date, returns null if invalid. */
function parseDateInput(text) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(`${text}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Auto-mask raw digits into the given date variant's separator format, as the
 * user types on a numeric-only keyboard (which has no "-" key). Extracts only
 * digits from the input (so it works whether the caller passes raw digits or
 * an already-masked string with stale separators) and re-inserts separators
 * at fixed digit positions.
 */
function maskDateDigits(text, variant) {
  const digits = text.replace(/\D/g, '');
  if (variant === 'month-year') {
    const mm = digits.slice(0, 2);
    const yyyy = digits.slice(2, 6);
    return yyyy ? `${mm}-${yyyy}` : mm;
  }
  if (variant === 'year') {
    return digits.slice(0, 4);
  }
  // default: YYYY-MM-DD
  const yyyy = digits.slice(0, 4);
  const mm = digits.slice(4, 6);
  const dd = digits.slice(6, 8);
  let out = yyyy;
  if (mm) out += `-${mm}`;
  if (dd) out += `-${dd}`;
  return out;
}

/** Format a Date as UTC MM-YYYY string for display. */
function formatMonthYearDisplay(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${m}-${y}`;
}

/** Parse a MM-YYYY string to a UTC Date with day=1, returns null if invalid. */
function parseMonthYearInput(text) {
  const match = text.match(/^(\d{2})-(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  const d = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  if (isNaN(d.getTime())) return null;
  // Guard against JS Date overflow (e.g., year 99999)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1) return null;
  return d;
}

/** Format a Date as UTC YYYY string for display. */
function formatYearDisplay(d) {
  return String(d.getUTCFullYear());
}

/** Parse a YYYY string to a UTC Date with month=1, day=1, returns null if invalid. */
function parseYearInput(text) {
  const match = text.match(/^(\d{4})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const d = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  if (isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() !== year) return null;
  return d;
}
function formatCalendarDisplay(cal) {
  const y = String(cal.year).padStart(4, '0');
  const m = String(cal.month).padStart(2, '0');
  const d = String(cal.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function parseCalendarInput(text, toGregorian) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return toGregorian(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
}
const CALENDAR_VARIANTS = {
  buddhist: {
    toCalendar: gregorianToBuddhist,
    toGregorian: buddhistToGregorian
  },
  coptic: {
    toCalendar: gregorianToCoptic,
    toGregorian: copticToGregorian
  },
  ethiopian: {
    toCalendar: gregorianToEthiopian,
    toGregorian: ethiopianToGregorian
  },
  islamic: {
    toCalendar: gregorianToIslamic,
    toGregorian: islamicToGregorian
  },
  persian: {
    toCalendar: gregorianToPersian,
    toGregorian: persianToGregorian
  }
};
export function DateWidget({
  nodeRef,
  store,
  appearance
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('date', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const calendarVariant = CALENDAR_VARIANTS[variant];

  // Determine the store-derived display string based on variant
  let storeDisplayValue = '';
  if (value instanceof Date) {
    if (variant === 'month-year') {
      storeDisplayValue = formatMonthYearDisplay(value);
    } else if (variant === 'year') {
      storeDisplayValue = formatYearDisplay(value);
    } else if (calendarVariant) {
      storeDisplayValue = formatCalendarDisplay(calendarVariant.toCalendar(value));
    } else {
      storeDisplayValue = formatDateDisplay(value);
    }
  } else if (typeof value === 'string' && value !== '') {
    storeDisplayValue = value;
  }

  // Local text state drives the TextInput so the masked (separator-inserted)
  // string is visible WHILE the user is still typing, not only once the full
  // value is valid and committed to the store.
  const [text, setText] = useState(storeDisplayValue);

  // Keep local text in sync when the store value changes from outside
  // (e.g. programmatic answer, navigating to a different question instance).
  useEffect(() => {
    setText(storeDisplayValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeDisplayValue]);

  // Native picker visibility (default variant only). Declared unconditionally
  // alongside the other hooks above, regardless of whether the optional
  // datetimepicker peer dep is present, to keep hook order stable.
  const [showNativePicker, setShowNativePicker] = useState(false);
  const DateTimePicker = getDateTimePicker();
  const showPickerButton = variant === 'default' && DateTimePicker !== null;
  // 'no-calendar' deliberately never shows the native picker button, even
  // when the optional peer dep is installed — same TextInput/mask path as
  // 'default' otherwise (see docblock).

  function commitDate(selectedDate) {
    const utcDate = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
    setText(formatDateDisplay(utcDate));
    store.answerQuestion(nodeRef, utcDate);
  }

  // Android's dialog picker fires 'onChange' exactly once (on confirm or
  // cancel) and dismisses itself, so closing here is correct there. iOS's
  // spinner/inline picker fires 'onChange' on every scroll of the wheel and
  // never dismisses itself — closing on the first event would hide it before
  // the user finishes choosing, so iOS instead relies on the "Listo" button
  // (handleIosPickerDone) to close.
  function handleNativePickerChange(event, selectedDate) {
    if (Platform.OS === 'android') {
      setShowNativePicker(false);
      if (event.type === 'dismissed' || !selectedDate) return;
      commitDate(selectedDate);
      return;
    }
    if (selectedDate) commitDate(selectedDate);
  }
  function handleIosPickerDone() {
    setShowNativePicker(false);
  }
  const placeholder = variant === 'month-year' ? 'MM-YYYY' : variant === 'year' ? 'YYYY' : 'YYYY-MM-DD';
  const maxLength = variant === 'month-year' ? 7 : variant === 'year' ? 4 : 10;
  function handleChange(raw) {
    if (isReadonly) return;
    const masked = maskDateDigits(raw, variant);
    setText(masked);
    let parsed = null;
    if (variant === 'month-year') {
      parsed = parseMonthYearInput(masked);
    } else if (variant === 'year') {
      parsed = parseYearInput(masked);
    } else if (calendarVariant) {
      parsed = parseCalendarInput(masked, calendarVariant.toGregorian);
    } else {
      parsed = parseDateInput(masked);
    }
    if (parsed !== null) {
      store.answerQuestion(nodeRef, parsed);
    }
    // If not valid yet, don't commit — user is still typing
  }
  return /*#__PURE__*/_jsxs(View, {
    style: styles.container,
    children: [/*#__PURE__*/_jsxs(View, {
      style: styles.row,
      children: [/*#__PURE__*/_jsx(TextInput, {
        testID: "date-input",
        style: [styles.input, focused && styles.focused, isReadonly && styles.readonly],
        value: text,
        onChangeText: handleChange,
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        editable: !isReadonly,
        placeholder: placeholder,
        placeholderTextColor: theme.color.roles.onSurfaceVariant,
        keyboardType: "numeric",
        maxLength: maxLength,
        autoCapitalize: "none"
      }), showPickerButton && /*#__PURE__*/_jsx(Pressable, {
        testID: "date-picker-button",
        onPress: () => setShowNativePicker(true),
        disabled: isReadonly,
        style: [styles.pickerButton, isReadonly && styles.readonly],
        children: /*#__PURE__*/_jsx(CalendarIcon, {
          testID: "date-picker-icon",
          color: theme.color.roles.primary,
          theme: theme
        })
      })]
    }), showPickerButton && showNativePicker && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsx(DateTimePicker, {
        testID: "date-native-picker",
        value: value instanceof Date ? value : new Date(),
        mode: "date",
        display: Platform.OS === 'ios' ? 'inline' : 'default',
        onChange: handleNativePickerChange
      }), Platform.OS === 'ios' && /*#__PURE__*/_jsx(Pressable, {
        testID: "date-picker-done-button",
        onPress: handleIosPickerDone,
        style: styles.pickerDoneButton,
        children: /*#__PURE__*/_jsx(Text, {
          style: styles.pickerDoneText,
          children: "Done"
        })
      })]
    })]
  });
}
//# sourceMappingURL=DateWidget.js.map