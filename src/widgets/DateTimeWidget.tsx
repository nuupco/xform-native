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

import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface DateTimeWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/** Format a Date as UTC YYYY-MM-DDTHH:MM string for display. */
function formatDateTimeDisplay(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${m}`;
}

/** Parse YYYY-MM-DDTHH:MM to a Date, returns null if invalid. */
function parseDateTimeInput(text: string): Date | null {
  // Accept "YYYY-MM-DDTHH:MM" or "YYYY-MM-DD HH:MM"
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00.000Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function DateTimeWidget({ nodeRef, store, appearance: _appearance }: DateTimeWidgetProps) {
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

  function handleChange(text: string) {
    if (isReadonly) return;
    const parsed = parseDateTimeInput(text);
    if (parsed !== null) {
      store.answerQuestion(nodeRef, parsed);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        testID="datetime-input"
        style={[styles.input, isReadonly && styles.readonly]}
        value={displayValue}
        onChangeText={handleChange}
        editable={!isReadonly}
        placeholder="YYYY-MM-DDTHH:MM"
        keyboardType="default"
        maxLength={16}
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
