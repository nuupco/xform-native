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
 *   default    → full YYYY-MM-DD TextInput (+ native picker button when available)
 *   month-year → MM-YYYY entry, stored as Date with day=1
 *   year       → YYYY entry, stored as Date with month=1, day=1
 */

import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import { CalendarIcon } from './primitives/Icon';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

function createStyles(t: Theme) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: { marginVertical: t.spacing.xs },
    row: f.fieldRow,
    input: { ...f.field, ...f.fieldNumeric, flex: 1 },
    focused: f.fieldFocused,
    readonly: f.fieldDisabled,
    pickerButton: f.fieldAffordance,
  });
}

let _DateTimePicker: any | null = null;
let _pickerLoaded: boolean | undefined;

function getDateTimePicker(): any | null {
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

export interface DateWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/** Format a Date as UTC YYYY-MM-DD string for display. */
function formatDateDisplay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string to a UTC Date, returns null if invalid. */
function parseDateInput(text: string): Date | null {
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
function maskDateDigits(text: string, variant: string): string {
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
function formatMonthYearDisplay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${m}-${y}`;
}

/** Parse a MM-YYYY string to a UTC Date with day=1, returns null if invalid. */
function parseMonthYearInput(text: string): Date | null {
  const match = text.match(/^(\d{2})-(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1]!, 10);
  const year = parseInt(match[2]!, 10);
  if (month < 1 || month > 12) return null;
  const d = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  if (isNaN(d.getTime())) return null;
  // Guard against JS Date overflow (e.g., year 99999)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1) return null;
  return d;
}

/** Format a Date as UTC YYYY string for display. */
function formatYearDisplay(d: Date): string {
  return String(d.getUTCFullYear());
}

/** Parse a YYYY string to a UTC Date with month=1, day=1, returns null if invalid. */
function parseYearInput(text: string): Date | null {
  const match = text.match(/^(\d{4})$/);
  if (!match) return null;
  const year = parseInt(match[1]!, 10);
  const d = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  if (isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() !== year) return null;
  return d;
}

export function DateWidget({ nodeRef, store, appearance }: DateWidgetProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('date', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  // Determine the store-derived display string based on variant
  let storeDisplayValue = '';
  if (value instanceof Date) {
    if (variant === 'month-year') {
      storeDisplayValue = formatMonthYearDisplay(value);
    } else if (variant === 'year') {
      storeDisplayValue = formatYearDisplay(value);
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

  function handleNativePickerChange(_event: unknown, selectedDate?: Date) {
    setShowNativePicker(false);
    if (!selectedDate) return;
    const utcDate = new Date(
      Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      ),
    );
    setText(formatDateDisplay(utcDate));
    store.answerQuestion(nodeRef, utcDate);
  }

  const placeholder =
    variant === 'month-year' ? 'MM-YYYY' : variant === 'year' ? 'YYYY' : 'YYYY-MM-DD';

  const maxLength = variant === 'month-year' ? 7 : variant === 'year' ? 4 : 10;

  function handleChange(raw: string) {
    if (isReadonly) return;
    const masked = maskDateDigits(raw, variant);
    setText(masked);

    let parsed: Date | null = null;
    if (variant === 'month-year') {
      parsed = parseMonthYearInput(masked);
    } else if (variant === 'year') {
      parsed = parseYearInput(masked);
    } else {
      parsed = parseDateInput(masked);
    }
    if (parsed !== null) {
      store.answerQuestion(nodeRef, parsed);
    }
    // If not valid yet, don't commit — user is still typing
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          testID="date-input"
          style={[
            styles.input,
            focused && styles.focused,
            isReadonly && styles.readonly,
          ]}
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!isReadonly}
          placeholder={placeholder}
          placeholderTextColor={theme.color.roles.onSurfaceVariant}
          keyboardType="numeric"
          maxLength={maxLength}
          autoCapitalize="none"
        />
        {showPickerButton && (
          <Pressable
            testID="date-picker-button"
            onPress={() => setShowNativePicker(true)}
            disabled={isReadonly}
            style={[styles.pickerButton, isReadonly && styles.readonly]}
          >
            <CalendarIcon testID="date-picker-icon" color={theme.color.roles.primary} theme={theme} />
          </Pressable>
        )}
      </View>
      {showPickerButton && showNativePicker && (
        <DateTimePicker
          testID="date-native-picker"
          value={value instanceof Date ? value : new Date()}
          mode="date"
          onChange={handleNativePickerChange}
        />
      )}
    </View>
  );
}
