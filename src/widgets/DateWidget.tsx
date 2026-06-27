/**
 * DateWidget — renders a date entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with YYYY-MM-DD mask/validation.
 *
 * Value shape (ts-rosa codecs.ts:153-158, AnswerValue.ts:27):
 *   date value = Date object (UTC midnight for the given date).
 *   store.answerQuestion receives a Date directly.
 *
 * Variants (ADR-3 date):
 *   default    → full YYYY-MM-DD TextInput
 *   month-year → MM-YYYY entry (P1: same TextInput, placeholder adapted)
 *   year       → YYYY entry (P1: same TextInput, placeholder adapted)
 */

import { View, TextInput, Text, StyleSheet } from 'react-native';
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

export function DateWidget({ ref, store, appearance }: DateWidgetProps) {
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(ref);
  const value = store.adapter.resolveValue(ref);
  const variant = resolveVariant('date', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;
  const isRequired = nodeState?.required ?? false;

  // Determine display string
  let displayValue = '';
  if (value instanceof Date) {
    displayValue = formatDateDisplay(value);
  } else if (typeof value === 'string' && value !== '') {
    displayValue = value;
  }

  const placeholder =
    variant === 'month-year' ? 'MM-YYYY' : variant === 'year' ? 'YYYY' : 'YYYY-MM-DD';

  function handleChange(text: string) {
    if (isReadonly) return;
    const parsed = parseDateInput(text);
    if (parsed !== null) {
      store.answerQuestion(ref, parsed);
    }
    // If not a valid date yet, don't commit — user is still typing
  }

  return (
    <View style={styles.container}>
      {isRequired && (
        <Text testID="required-indicator" style={styles.required}>
          *
        </Text>
      )}
      <TextInput
        testID="date-input"
        style={[styles.input, isReadonly && styles.readonly]}
        value={displayValue}
        onChangeText={handleChange}
        editable={!isReadonly}
        placeholder={placeholder}
        keyboardType="numeric"
        maxLength={10}
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
  required: {
    color: tokens.color.error,
    fontSize: tokens.font.sm,
  },
});
