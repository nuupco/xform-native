/**
 * fieldStyles — shared M3 filled-field style block (design decision 2).
 *
 * The bordered-input block (surfaceVariant/surface background, 1px outline
 * resting border, 2px primary/error focus/error underline, disabled fade)
 * was duplicated 11x across String/Long/Int/Decimal/Date/Time/DateTime/
 * SelectOne/SelectMulti/Range. `createFieldStyles(theme)` extracts it once.
 *
 * Returns PLAIN OBJECTS, not a `StyleSheet.create()` result, so consuming
 * widgets can spread them into their own `StyleSheet.create({...})` calls
 * (see StringWidget's worked example in the Phase 3 design doc).
 */
import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme } from '../../theme/ThemeContext';

export interface FieldStyles {
  field: ViewStyle;
  fieldText: TextStyle;
  fieldNumeric: TextStyle;
  fieldFocused: ViewStyle;
  fieldError: ViewStyle;
  fieldDisabled: ViewStyle & TextStyle;
  fieldRow: ViewStyle;
  fieldAffordance: ViewStyle;
}

export function createFieldStyles(t: Theme): FieldStyles {
  return {
    field: {
      borderWidth: 1,
      borderColor: t.color.roles.outline,
      borderRadius: t.radius.md,
      minHeight: 48,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      backgroundColor: t.color.roles.surface,
    },
    fieldText: {
      ...t.typography.bodyLarge,
      color: t.color.roles.onSurface,
    },
    fieldNumeric: {
      ...t.typography.mono,
      color: t.color.roles.onSurface,
    },
    fieldFocused: {
      borderWidth: 2,
      borderColor: t.color.roles.primary,
    },
    fieldError: {
      borderWidth: 2,
      borderColor: t.color.roles.error,
    },
    fieldDisabled: {
      backgroundColor: t.color.roles.surfaceVariant,
      color: t.color.roles.onSurfaceVariant,
      opacity: t.disabled.contentOpacity,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    fieldAffordance: {
      width: 48,
      height: 48,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.color.roles.primaryContainer,
    },
  };
}
