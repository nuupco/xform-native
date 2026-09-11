/**
 * PressableButton — shared filled/text button primitive (design decision 11).
 *
 * Used by NavRow (PR2) and BofSurface/EofSurface (PR3). Filled variant fills
 * the container with `roles.primary`/`roles.secondary`; text variant has no
 * background and colored text. Disabled state fades content opacity only
 * (38%) — the container background/fill is never grayed out. Android uses
 * `android_ripple` at primary@12%; iOS fades content opacity to 0.7 while
 * pressed (no ripple on iOS).
 *
 * The style/color computation is extracted into pure functions so the
 * variant/tone/pressed/disabled matrix is unit-testable without simulating
 * native touch/press state through the renderer.
 */
import { Platform, type ViewStyle, type TextStyle } from 'react-native';
import { type Theme } from '../../theme/ThemeContext.js';
export type PressableButtonVariant = 'filled' | 'text';
export type PressableButtonTone = 'primary' | 'secondary' | 'error';
export interface PressableButtonProps {
    label: string;
    onPress: () => void;
    variant?: PressableButtonVariant;
    tone?: PressableButtonTone;
    height?: number;
    disabled?: boolean;
    fullWidth?: boolean;
    testID?: string;
    /** Optional theme override (design decision 10); defaults to `useTheme()`'s current theme. */
    theme?: Theme;
}
/** Per-channel hex → `rgba(r, g, b, alpha)` string (no color-science dep). */
export declare function hexToRgba(hex: string, alpha: number): string;
/** `roles.primary` at 12% alpha — the Android ripple color for every variant/tone. */
export declare function androidRippleColor(t?: Theme): string;
/** Background color for the filled variant per tone; `undefined` for text variant. */
export declare function resolveButtonBackground(variant: PressableButtonVariant, tone: PressableButtonTone, t?: Theme): string | undefined;
/** Text color: filled → the tone's "on" color; text variant → the tone's accent color. */
export declare function resolveButtonTextColor(variant: PressableButtonVariant, tone: PressableButtonTone, t?: Theme): string;
export interface ContainerStyleOpts {
    variant: PressableButtonVariant;
    tone: PressableButtonTone;
    height: number;
    fullWidth: boolean;
    pressed: boolean;
    platformOS: typeof Platform.OS;
    theme?: Theme;
}
/** Pure container-style resolver — same matrix the component's `style` fn uses. */
export declare function resolveContainerStyle(opts: ContainerStyleOpts): ViewStyle;
/** Pure content (label) style resolver — disabled fades content only, 0.38. */
export declare function resolveContentStyle(variant: PressableButtonVariant, tone: PressableButtonTone, disabled: boolean, t?: Theme): TextStyle;
export declare function PressableButton({ label, onPress, variant, tone, height, disabled, fullWidth, testID, theme, }: PressableButtonProps): import("react").JSX.Element;
//# sourceMappingURL=PressableButton.d.ts.map