/**
 * PermissionNotice — shared presentational permission card (Phase 6,
 * design decisions 5-6).
 *
 * Reuses `GpsPermissionNotice`'s visual language (`roles.surface`,
 * `radius.md`, `elevationStyle(t,3)`, `outlineVariant` border,
 * `titleSmall`/`bodySmall`, `PressableButton` actions) but is a plain
 * inline card (flow layout, not absolutely positioned) — media widgets
 * aren't map overlays. It is rendered by each widget through
 * `MediaCaptureCard`'s existing `preview` slot with `state='captured'`, so
 * this component needs no knowledge of `MediaCaptureCard` itself.
 *
 * Unlike `GpsPermissionNotice`, copy is fully prop-driven rather than
 * status-derived: several distinct permission kinds (camera, microphone,
 * photo library) consume this one component with their own title/body/
 * action copy, so a status→copy switch here would have to know about all
 * of them (design decision 6).
 */
import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles, useTheme, type Theme } from '../../theme/ThemeContext';
import { elevationStyle } from '../../theme/elevationStyle';
import { PressableButton } from './PressableButton';

function createStyles(t: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.color.roles.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.color.roles.outlineVariant,
      padding: t.spacing.md,
      gap: t.spacing.xs,
      ...elevationStyle(t, 3),
    },
    title: {
      color: t.color.roles.onSurface,
      ...t.typography.titleSmall,
    },
    body: {
      color: t.color.roles.onSurfaceVariant,
      ...t.typography.bodySmall,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: t.spacing.sm,
      marginTop: t.spacing.xs,
    },
  });
}

export interface PermissionNoticeProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
  testID?: string;
}

/**
 * Dismiss renders only when both `dismissLabel` and `onDismiss` are given
 * (design decision 6) — omitted for e.g. `blocked` copy, which has no
 * "not now" affordance.
 */
export function PermissionNotice({
  title,
  body,
  primaryLabel,
  onPrimary,
  dismissLabel,
  onDismiss,
  testID = 'permission-notice',
}: PermissionNoticeProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const showDismiss = Boolean(dismissLabel && onDismiss);

  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        {showDismiss && (
          <PressableButton
            label={dismissLabel!}
            onPress={onDismiss!}
            variant="text"
            tone="secondary"
            testID={`${testID}-dismiss`}
            theme={theme}
          />
        )}
        <PressableButton
          label={primaryLabel}
          onPress={onPrimary}
          variant="filled"
          tone="primary"
          testID={`${testID}-primary`}
          theme={theme}
        />
      </View>
    </View>
  );
}
