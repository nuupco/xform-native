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
import type { Theme } from '../../theme/ThemeContext.js';
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
export declare function createFieldStyles(t: Theme): FieldStyles;
//# sourceMappingURL=fieldStyles.d.ts.map