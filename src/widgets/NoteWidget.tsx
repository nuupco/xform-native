/**
 * NoteWidget — read-only display of note text (REQ-15).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(ref).
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { tokens } from '../tokens/tokens';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface NoteWidgetProps {
  ref: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function NoteWidget({ ref, store }: NoteWidgetProps) {
  useFormSession(store);
  const value = store.adapter.resolveValue(ref);
  const text = value != null ? String(value) : '';

  return (
    <View style={styles.container} testID="note-widget">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    marginVertical: tokens.spacing.xs,
  },
  text: {
    fontSize: tokens.font.md,
    color: tokens.color.text,
    fontStyle: 'italic',
  },
});
