/**
 * LongWidget — long integer input (REQ-13).
 *
 * Uses parseFloat for the committed value (JavaScript has no 64-bit int;
 * long is a large number — decision 3, no BigInt rework in this change).
 * The draft parse predicate stays integer-shaped (no decimal points),
 * matching Int, even though the committed value is produced via parseFloat.
 * Draft-vs-committed-store separation delegated to useDraftValue.
 */

import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import { resolveVariant } from './appearance';
import { useDraftValue } from './useDraftValue';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface LongWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function LongWidget({ nodeRef, store, appearance }: LongWidgetProps) {
  useFormSession(store);
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
        style={[styles.input, isReadonly && styles.readonly]}
        value={draft.value}
        onChangeText={draft.onChangeText}
        editable={!isReadonly}
        keyboardType="number-pad"
        onFocus={draft.onFocus}
        onBlur={draft.onBlur}
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
  },
});
