import { type GestureResponderEvent } from 'react-native';
import { type Theme } from '../../theme/ThemeContext.js';
export type SelectionControl = 'radio' | 'checkbox';
export interface SelectionIndicatorProps {
    control: SelectionControl;
    selected: boolean;
    testID?: string;
    size?: number;
    /** Optional theme override (same pattern as Icon/PressableButton, decision 10). */
    theme?: Theme;
}
/** `primaryContainer` at 40% alpha — selected SelectionRow's tinted background (decision 3). */
export declare function selectedRowBackground(t?: Theme): string;
/**
 * SelectionIndicator — radio (circle) or checkbox (square) marker.
 *
 * Radio: 20dp circle, 2px `outline` border resting; selected = `primary`
 * fill + `onPrimary` dot.
 * Checkbox: square (`radius.sm`), 2px `outline` border resting; selected =
 * `primary` background + `onPrimary` check, animated via a 150ms
 * `Animated.timing` check-draw (opacity/scale of the check glyph).
 */
export declare function SelectionIndicator({ control, selected, testID, size, theme, }: SelectionIndicatorProps): import("react").JSX.Element;
export type SelectionRowDensity = 'default' | 'pack' | 'likert';
export interface SelectionRowProps {
    control: SelectionControl;
    selected: boolean;
    onPress: (event: GestureResponderEvent) => void;
    label?: string;
    disabled?: boolean;
    testID?: string;
    accessibilityRole?: 'radio' | 'checkbox' | 'button';
    theme?: Theme;
    children?: React.ReactNode;
    /**
     * Row density (deferred from PR3, needed by SelectOne's compact variants —
     * PR6): 'default' is the full-width 56dp row; 'pack' is a shorter 40dp row
     * (SelectOne columns-pack); 'likert' is a compact, non-stretched cell with
     * the label stacked above the indicator (SelectOne likert row).
     */
    density?: SelectionRowDensity;
}
/**
 * SelectionRow — full-width, 56dp min-height Pressable row wrapping a
 * SelectionIndicator + label (or arbitrary `children` content slot for
 * callers that need a custom center layout, e.g. Rank's grip/number/text
 * shell reusing just the row chrome with `control` semantics ignored).
 */
export declare function SelectionRow({ control, selected, onPress, label, disabled, testID, accessibilityRole, theme, children, density, }: SelectionRowProps): import("react").JSX.Element;
//# sourceMappingURL=SelectionRow.d.ts.map