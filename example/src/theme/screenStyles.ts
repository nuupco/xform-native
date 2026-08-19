import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme } from '@nuup/xform-native';
import { elevationStyle } from '@nuup/xform-native';

/**
 * createScreenStyles — shared chrome extracted from the example app's
 * screens (Phase 4 restyle, design decision 3).
 *
 * These were copy-pasted verbatim across 4-5 screens each under the old
 * blue-Material styling: the header/back-button/title block, the
 * centered/empty/error state block, and the row-card block. This file is
 * example-app-local (not part of the library's public API) — screens spread
 * these plain objects into their own `StyleSheet.create` call, mirroring the
 * `createFieldStyles` contract already used inside the library.
 */
export interface ScreenStyles {
  screen: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  headerAction: ViewStyle;
  headerActionText: TextStyle;
  centered: ViewStyle;
  emptyText: TextStyle;
  errorText: TextStyle;
  listRow: ViewStyle;
  rowInfo: ViewStyle;
  rowTitle: TextStyle;
  rowMeta: TextStyle;
  sectionHeader: ViewStyle;
  sectionHeaderText: TextStyle;
  banner: ViewStyle;
  bannerText: TextStyle;
}

export function createScreenStyles(t: Theme): ScreenStyles {
  return {
    screen: {
      flex: 1,
      backgroundColor: t.color.roles.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.color.roles.primary,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      gap: t.spacing.sm,
      // Cast: `elevationStyle`'s ViewStyle is typed against the library's own
      // react-native (0.79.x); the example app resolves a different
      // react-native (0.85.x). Both are the same RN ViewStyle shape at
      // runtime — this is a cross-package type-identity mismatch, not a
      // real type error.
      ...(elevationStyle(t, 2) as object),
    },
    headerTitle: {
      flex: 1,
      ...t.typography.titleLarge,
      color: t.color.roles.onPrimary,
    },
    backButton: {
      paddingHorizontal: t.spacing.xs,
      paddingVertical: t.spacing.xxs,
    },
    backButtonText: {
      ...t.typography.labelLarge,
      color: t.color.roles.onPrimary,
    },
    headerAction: {
      backgroundColor: t.color.roles.primaryContainer,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    headerActionText: {
      ...t.typography.labelLarge,
      color: t.color.roles.onPrimaryContainer,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing.lg,
    },
    emptyText: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurfaceVariant,
      textAlign: 'center',
    },
    errorText: {
      ...t.typography.bodyLarge,
      color: t.color.roles.error,
      textAlign: 'center',
      marginBottom: t.spacing.md,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.color.roles.outlineVariant,
      backgroundColor: t.color.roles.surface,
    },
    rowInfo: {
      flex: 1,
      gap: t.spacing.xxs,
    },
    rowTitle: {
      ...t.typography.titleMedium,
      color: t.color.roles.onSurface,
    },
    rowMeta: {
      ...t.typography.bodySmall,
      color: t.color.roles.onSurfaceVariant,
    },
    sectionHeader: {
      backgroundColor: t.color.roles.surfaceVariant,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    sectionHeaderText: {
      ...t.typography.labelMedium,
      color: t.color.roles.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    banner: {
      backgroundColor: t.color.roles.tertiaryContainer,
      borderBottomWidth: 2,
      borderBottomColor: t.color.roles.tertiary,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
    },
    bannerText: {
      ...t.typography.bodySmall,
      color: t.color.roles.onTertiaryContainer,
    },
  };
}
