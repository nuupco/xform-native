/**
 * TimeWidget — renders a time entry field (REQ-13).
 *
 * RN-core only — no @react-native-community/datetimepicker (ZERO native deps constraint).
 * Entry via formatted TextInput with HH:MM validation.
 *
 * Value shape (ts-rosa v0.7.4 codecs.ts, AnswerValue.ts):
 *   time value = Date object anchored to epoch (1970-01-01) + optional
 *   `.offset` (raw UTC offset string the answer was captured with).
 *   store.answerQuestion receives a Date directly.
 *
 * Display: HH:MM using the OFFSET THE ANSWER WAS CAPTURED WITH (product
 * decision — odd/tasks/time-offset-awareness.md), not the device's current
 * offset. `store.adapter.getAnswerOffset(nodeRef)` surfaces that stored
 * offset; `undefined`/`"Z"` (legacy/offset-less data) falls back to plain
 * UTC getters, identical to the pre-existing behavior.
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

/**
 * Compute the wall-clock hour/minute for a given absolute `instant` at a
 * FIXED offset string ("Z" or "±HH:MM"), without depending on ts-rosa's
 * internal Temporal polyfill: shift the instant's epoch ms by the offset's
 * total minutes and read UTC getters off the shifted instant. `"Z"` /
 * `undefined` / an unrecognized offset behaves identically to plain
 * `getUTCHours()/getUTCMinutes()` (backward compatible for legacy/
 * offset-less data).
 */
function wallClockAtOffset(instant: Date, offset: string | undefined): { hours: number; minutes: number } {
  if (!offset || offset === 'Z') {
    return { hours: instant.getUTCHours(), minutes: instant.getUTCMinutes() };
  }
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) {
    return { hours: instant.getUTCHours(), minutes: instant.getUTCMinutes() };
  }
  const sign = match[1] === '-' ? -1 : 1;
  const offsetHours = parseInt(match[2] ?? '0', 10);
  const offsetMinutes = parseInt(match[3] ?? '0', 10);
  const totalMinutes = sign * (offsetHours * 60 + offsetMinutes);
  const shifted = new Date(instant.getTime() + totalMinutes * 60000);
  return { hours: shifted.getUTCHours(), minutes: shifted.getUTCMinutes() };
}

/**
 * Format a Date for display using the offset it was CAPTURED with (product
 * decision: existing answers display via their stored offset, not the
 * device's current offset). `offset` is `undefined`/`"Z"` for legacy/
 * offset-less stored values — identical to the pre-existing UTC-getter
 * behavior.
 */
function formatTimeDisplay(d: Date, offset: string | undefined): string {
  const { hours, minutes } = wallClockAtOffset(d, offset);
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

/** Parse HH:MM to a Date anchored on epoch, returns null if invalid. */
function parseTimeInput(text: string): Date | null {
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  // LOCAL Date construction (not UTC/`Z`-anchored) — so the runtime resolves
  // this wall-clock entry to the correct real instant using the device's
  // actual current offset rules. encodeAnswer.toRawString then formats this
  // same Date's local getters + the device's current offset for `cast()`.
  const d = new Date(1970, 0, 0, h, m, 0, 0);
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
    storeDisplayValue = formatTimeDisplay(value, store.adapter.getAnswerOffset(nodeRef));
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
