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

import { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import { ClockIcon } from './primitives/Icon';
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
    pickerAffordance: f.fieldAffordance,
  });
}

export interface TimeWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

/** Format a Date as UTC HH:MM string for display. */
function formatTimeDisplay(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Parse HH:MM to a Date anchored on epoch, returns null if invalid. */
function parseTimeInput(text: string): Date | null {
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date(`1970-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Auto-mask raw digits into "HH:MM", as the user types on a numeric-only
 * keyboard (which has no ":" key). Extracts only digits and re-inserts the
 * separator after the 2nd digit.
 */
function maskTimeDigits(text: string): string {
  const digits = text.replace(/\D/g, '');
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  return mm ? `${hh}:${mm}` : hh;
}

export function TimeWidget({ nodeRef, store, appearance: _appearance }: TimeWidgetProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);
  useFormSession(store);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const isReadonly = nodeState?.readonly ?? false;

  let storeDisplayValue = '';
  if (value instanceof Date) {
    storeDisplayValue = formatTimeDisplay(value);
  } else if (typeof value === 'string' && value !== '') {
    storeDisplayValue = value;
  }

  // Local text state drives the TextInput so the masked "HH:MM" string is
  // visible WHILE the user is still typing (numeric keyboard has no ":" key).
  const [text, setText] = useState(storeDisplayValue);

  useEffect(() => {
    setText(storeDisplayValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeDisplayValue]);

  function handleChange(raw: string) {
    if (isReadonly) return;
    const masked = maskTimeDigits(raw);
    setText(masked);
    const parsed = parseTimeInput(masked);
    if (parsed !== null) {
      store.answerQuestion(nodeRef, parsed);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          testID="time-input"
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
          placeholder="HH:MM"
          placeholderTextColor={theme.color.roles.onSurfaceVariant}
          keyboardType="numeric"
          maxLength={5}
          autoCapitalize="none"
        />
        {/* Affordance slot reserved for the native time picker (out of scope
            for PR5 — see design doc's "Open Decisions Carried Forward":
            "Time/DateTime native picker wiring: confirmed out of scope for
            PR5"). Rendered as a non-interactive icon so the trigger field's
            visual language matches Date/DateTime ahead of that wiring. */}
        <View style={styles.pickerAffordance}>
          <ClockIcon testID="time-picker-icon" color={theme.color.roles.primary} theme={theme} />
        </View>
      </View>
    </View>
  );
}
