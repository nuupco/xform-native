/**
 * DateWidget — renders a date entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with mask/validation.
 *
 * Value shape (ts-rosa codecs.ts:153-158, AnswerValue.ts:27):
 *   date value = Date object (UTC midnight for the given date).
 *   store.answerQuestion receives a Date directly.
 *
 * Variants (ADR-3 date):
 *   default    → full YYYY-MM-DD TextInput
 *   month-year → MM-YYYY entry, stored as Date with day=1
 *   year       → YYYY entry, stored as Date with month=1, day=1
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface DateWidgetProps {
  ref: NodeRef;
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

export function DateWidget({ ref, store, appearance }: DateWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const variant = resolveVariant('date', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  // Determine display string and commit parser based on variant
  let displayValue = '';
  if (value instanceof Date) {
    if (variant === 'month-year') {
      displayValue = formatMonthYearDisplay(value);
    } else if (variant === 'year') {
      displayValue = formatYearDisplay(value);
    } else {
      displayValue = formatDateDisplay(value);
    }
  } else if (typeof value === 'string' && value !== '') {
    displayValue = value;
  }

  const placeholder =
    variant === 'month-year' ? 'MM-YYYY' : variant === 'year' ? 'YYYY' : 'YYYY-MM-DD';

  const maxLength = variant === 'month-year' ? 7 : variant === 'year' ? 4 : 10;

  function handleChange(text: string) {
    if (isReadonly) return;
    let parsed: Date | null = null;
    if (variant === 'month-year') {
      parsed = parseMonthYearInput(text);
    } else if (variant === 'year') {
      parsed = parseYearInput(text);
    } else {
      parsed = parseDateInput(text);
    }
    if (parsed !== null) {
      store.answerQuestion(ref, parsed);
    }
    // If not valid yet, don't commit — user is still typing
  }

  return (
    <View style={styles.container}>
      <TextInput
        testID="date-input"
        style={[styles.input, isReadonly && styles.readonly]}
        value={displayValue}
        onChangeText={handleChange}
        editable={!isReadonly}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={maxLength}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.text,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    fontSize: tokens.font.md,
    color: tokens.color.text,
    backgroundColor: tokens.color.background,
  },
  readonly: {
    backgroundColor: tokens.color.surface,
    color: tokens.color.text,
  },
});
