/**
 * IntWidget — integer input (REQ-13).
 *
 * Draft-vs-committed-store separation delegated to useDraftValue
 * (widget-draft-value). Parse predicate rejects decimal points and lone
 * `-` rather than truncating/rejecting silently.
 */

import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { resolveVariant } from './engine/appearance';
import { useDraftValue } from './engine/useDraftValue';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import { createFieldStyles } from './primitives/fieldStyles';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface IntWidgetProps {
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
    input: {
      ...f.field,
      ...f.fieldNumeric,
      textAlign: 'left',
    },
    focused: f.fieldFocused,
    readonly: f.fieldDisabled,
  });
}

export function IntWidget({ nodeRef, store, appearance }: IntWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const [focused, setFocused] = useState(false);
  const nodeState = store.adapter.getNodeState(nodeRef);
  const value = store.adapter.resolveValue(nodeRef);
  const variant = resolveVariant('int', 'input', appearance);
  const isReadonly = nodeState?.readonly ?? false;

  function parse(text: string) {
    const s = text.replace(/,/g, '').trim();
    if (s === '') return { committable: true, value: null };
    if (/^-?\d+$/.test(s)) return { committable: true, value: parseInt(s, 10) };
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
        testID="int-input"
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
