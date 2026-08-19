/**
 * NoteWidget — read-only display of note text (REQ-15).
 *
 * Never calls answerQuestion. No editable input element.
 * Renders text from resolveValue(nodeRef). Renders nothing at all when
 * that value is empty — an empty note (e.g. a readonly/calculated field
 * whose expression hasn't resolved to anything yet) has no information to
 * show, so it shouldn't reserve visual space or leak an empty box.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useFormSession } from '../store/useFormSession';
import { useThemedStyles, type Theme } from '../theme/ThemeContext';
import type { NodeRef } from '../adapter/FormAdapter';
import type { FormSessionStore } from '../store/FormSessionStore';

export interface NoteWidgetProps {
  nodeRef: NodeRef;
  store: FormSessionStore;
  appearance?: string | null;
}

export function NoteWidget({ nodeRef, store }: NoteWidgetProps) {
  const styles = useThemedStyles(createStyles);
  useFormSession(store);
  const value = store.adapter.resolveValue(nodeRef);
  const text = value != null ? String(value) : '';

  if (text.trim().length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="note-widget">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      backgroundColor: t.color.roles.secondaryContainer,
      borderRadius: t.radius.md,
    },
    text: {
      ...t.typography.bodyMedium,
      color: t.color.roles.onSecondaryContainer,
    },
  });
}
