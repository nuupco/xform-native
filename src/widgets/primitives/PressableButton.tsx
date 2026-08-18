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
import {
  Pressable,
  Text,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { tokens } from '../../tokens/tokens';
import type { Theme } from '../../theme/ThemeContext';

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
  /** Optional theme override (design decision 10); defaults to the raw `tokens` singleton. */
  theme?: Theme;
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
export function androidRippleColor(t: Theme = tokens): string {
  return hexToRgba(t.color.roles.primary, 0.12);
}

/** Background color for the filled variant per tone; `undefined` for text variant. */
export function resolveButtonBackground(
  variant: PressableButtonVariant,
  tone: PressableButtonTone,
  t: Theme = tokens
): string | undefined {
  if (variant !== 'filled') return undefined;
  if (tone === 'secondary') return t.color.roles.secondary;
  if (tone === 'error') return t.color.roles.error;
  return t.color.roles.primary;
}

/** Text color: filled → the tone's "on" color; text variant → the tone's accent color. */
export function resolveButtonTextColor(
  variant: PressableButtonVariant,
  tone: PressableButtonTone,
  t: Theme = tokens
): string {
  if (variant !== 'filled') {
    return tone === 'error' ? t.color.roles.error : t.color.roles.primary;
  }
  if (tone === 'secondary') return t.color.roles.onSecondary;
  if (tone === 'error') return t.color.roles.onError;
  return t.color.roles.onPrimary;
}

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
export function resolveContainerStyle(opts: ContainerStyleOpts): ViewStyle {
  const t = opts.theme ?? tokens;
  const bg = resolveButtonBackground(opts.variant, opts.tone, t);
  return {
    height: opts.height,
    borderRadius: t.radius.md,
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
  t: Theme = tokens
): TextStyle {
  return {
    fontSize: t.font.md,
    fontWeight: '600',
    color: resolveButtonTextColor(variant, tone, t),
    ...(disabled ? { opacity: t.disabled.contentOpacity } : null),
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
  theme = tokens,
}: PressableButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: androidRippleColor(theme) }}
      style={({ pressed }) =>
        resolveContainerStyle({
          variant,
          tone,
          height,
          fullWidth,
          pressed,
          platformOS: Platform.OS,
          theme,
        })
      }
    >
      <Text style={resolveContentStyle(variant, tone, disabled, theme)}>
        {label}
      </Text>
    </Pressable>
  );
}
