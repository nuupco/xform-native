/**
 * MediaCaptureCard — shared M3 media-capture chrome primitive (design
 * decision 7).
 *
 * Extracted from Image/Audio/Video/File/Barcode, which all render the
 * identical `container gap:sm` + button-row + `buttonText` triple across
 * 2-4 states each (~14 sites total). This PR (slice 10) ships the primitive
 * only — no existing widget consumes it yet; Image/File/Barcode wire in
 * PR11, Audio/Video in PR12.
 *
 * Action rendering reuses `PressableButton` (decision 11) so the
 * `tone:'error'` (Stop/Cancel), disabled-opacity, and ripple/press matrix
 * come for free instead of being re-implemented here.
 */
import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../../theme/ThemeContext';
import { PressableButton, type PressableButtonTone } from './PressableButton';

export type MediaCaptureCardState = 'empty' | 'captured' | 'active';

export interface MediaCaptureCardAction {
  label: string;
  icon?: ReactNode;
  tone?: PressableButtonTone;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}

export interface MediaCaptureCardProps {
  state: MediaCaptureCardState;
  icon: ReactNode;
  title: string;
  hint?: string;
  actions: MediaCaptureCardAction[];
  preview?: ReactNode;
  disabled?: boolean;
  testID?: string;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { gap: t.spacing.sm },
    emptyState: {
      alignItems: 'center',
      gap: t.spacing.xs,
      padding: t.spacing.sm,
    },
    title: { ...t.typography.bodyLarge, color: t.color.roles.onSurface },
    hint: { ...t.typography.bodySmall, color: t.color.roles.onSurfaceVariant },
    preview: { alignItems: 'center' },
    actionRow: { flexDirection: 'row', gap: t.spacing.sm },
    disabledContent: { opacity: t.disabled.contentOpacity },
  });
}

/**
 * `state:'captured'` renders only `preview` (falling back to nothing if the
 * caller forgot to pass one); `empty`/`active` render `icon`/`title`/`hint`.
 * Actions render in every state — capture flows (e.g. Audio's Stop button)
 * need actions available while `active`.
 */
export function MediaCaptureCard({
  state,
  icon,
  title,
  hint,
  actions,
  preview,
  disabled = false,
  testID,
}: MediaCaptureCardProps) {
  const styles = useThemedStyles(createStyles);
  const isCaptured = state === 'captured';

  return (
    <View style={[styles.container, disabled && styles.disabledContent]} testID={testID}>
      {isCaptured ? (
        <View style={styles.preview}>{preview}</View>
      ) : (
        <View style={styles.emptyState}>
          {icon}
          <Text style={styles.title}>{title}</Text>
          {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
        </View>
      )}
      {actions.length > 0 && (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <PressableButton
              key={action.testID ?? action.label}
              label={action.label}
              onPress={action.onPress}
              variant="text"
              tone={action.tone ?? 'primary'}
              disabled={disabled || action.disabled}
              testID={action.testID}
            />
          ))}
        </View>
      )}
    </View>
  );
}
