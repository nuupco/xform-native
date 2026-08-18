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
import { Pressable, Text, Platform, type ViewStyle, type TextStyle } from 'react-native';
import { tokens } from '../../tokens/tokens';

export type PressableButtonVariant = 'filled' | 'text';
export type PressableButtonTone = 'primary' | 'secondary';

export interface PressableButtonProps {
  label: string;
  onPress: () => void;
  variant?: PressableButtonVariant;
  tone?: PressableButtonTone;
  height?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

/** Per-channel hex → `rgba(r, g, b, alpha)` string (no color-science dep). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** `roles.primary` at 12% alpha — the Android ripple color for every variant/tone. */
export function androidRippleColor(): string {
  return hexToRgba(tokens.color.roles.primary, 0.12);
}

/** Background color for the filled variant per tone; `undefined` for text variant. */
export function resolveButtonBackground(
  variant: PressableButtonVariant,
  tone: PressableButtonTone,
): string | undefined {
  if (variant !== 'filled') return undefined;
  return tone === 'secondary' ? tokens.color.roles.secondary : tokens.color.roles.primary;
}

/** Text color: filled → the tone's "on" color; text variant → `roles.primary`. */
export function resolveButtonTextColor(
  variant: PressableButtonVariant,
  tone: PressableButtonTone,
): string {
  if (variant !== 'filled') return tokens.color.roles.primary;
  return tone === 'secondary' ? tokens.color.roles.onSecondary : tokens.color.roles.onPrimary;
}

export interface ContainerStyleOpts {
  variant: PressableButtonVariant;
  tone: PressableButtonTone;
  height: number;
  fullWidth: boolean;
  pressed: boolean;
  platformOS: typeof Platform.OS;
}

/** Pure container-style resolver — same matrix the component's `style` fn uses. */
export function resolveContainerStyle(opts: ContainerStyleOpts): ViewStyle {
  const bg = resolveButtonBackground(opts.variant, opts.tone);
  return {
    height: opts.height,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...(opts.fullWidth ? { alignSelf: 'stretch' as const } : null),
    ...(bg ? { backgroundColor: bg } : null),
    ...(opts.platformOS === 'ios' && opts.pressed ? { opacity: 0.7 } : null),
  };
}

/** Pure content (label) style resolver — disabled fades content only, 0.38. */
export function resolveContentStyle(
  variant: PressableButtonVariant,
  tone: PressableButtonTone,
  disabled: boolean,
): TextStyle {
  return {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: resolveButtonTextColor(variant, tone),
    ...(disabled ? { opacity: tokens.disabled.contentOpacity } : null),
  };
}

export function PressableButton({
  label,
  onPress,
  variant = 'filled',
  tone = 'primary',
  height = 48,
  disabled = false,
  fullWidth = false,
  testID,
}: PressableButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: androidRippleColor() }}
      style={({ pressed }) =>
        resolveContainerStyle({ variant, tone, height, fullWidth, pressed, platformOS: Platform.OS })
      }
    >
      <Text style={resolveContentStyle(variant, tone, disabled)}>{label}</Text>
    </Pressable>
  );
}
