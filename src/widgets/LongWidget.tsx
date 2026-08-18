/**
 * LongWidget — long integer input (REQ-13).
 *
 * Uses parseFloat for the committed value (JavaScript has no 64-bit int;
 * long is a large number — decision 3, no BigInt rework in this change).
 * The draft parse predicate stays integer-shaped (no decimal points),
 * matching Int, even though the committed value is produced via parseFloat.
 * Draft-vs-committed-store separation delegated to useDraftValue.
 */

import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { resolveVariant } from './appearance';
import { useDraftValue } from './useDraftValue';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface LongWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

function createStyles(t: Theme) {
  const f = createFieldStyles(t);
  return StyleSheet.create({
    container: {
      marginVertical: t.spacing.xs,
    },
    // Numeric field: fieldStyles box + fieldNumeric (mono) typography,
    // left-aligned per spec (not right-aligned like a ledger).
    input: {
      ...f.field,
      ...f.fieldNumeric,
      textAlign: 'left',
    },
    focused: f.fieldFocused,
    readonly: f.fieldDisabled,
  });
}

export function LongWidget({ nodeRef, store, appearance }: LongWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [focused, setFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('long', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function parse(text: string) {
    const s = text.replace(/,/g, '').trim();
    if (s === '') return { committable: true, value: null };
    if (/^-?\d+$/.test(s)) return { committable: true, value: parseFloat(s) };
    return { committable: false, value: null };
  }

  function format(raw: string) {
    return variant === 'thousands-sep' && raw !== '' ? Number(raw).toLocaleString('en-US') : raw;
  }

  const draft = useDraftValue<number>({
    storeValue: value,
    commit: (v) => store.answerQuestion(nodeRef, v),
    parse,
    format,
    readonly: isReadonly,
  });

  return (
    <View style={styles.container}>
      <TextInput
        testID="long-input"
        style={[
          styles.input,
          focused && !isReadonly && styles.focused,
          isReadonly && styles.readonly,
        ]}
        value={draft.value}
        onChangeText={draft.onChangeText}
        editable={!isReadonly}
        keyboardType="number-pad"
        onFocus={() => {
          setFocused(true);
          draft.onFocus();
        }}
        onBlur={() => {
          setFocused(false);
          draft.onBlur();
        }}
      />
    </View>
  );
}
