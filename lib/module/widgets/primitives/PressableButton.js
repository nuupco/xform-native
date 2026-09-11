"use strict";

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
import { Pressable, Text, Platform } from 'react-native';
import { useTheme, defaultTheme } from "../../theme/ThemeContext.js";
import { jsx as _jsx } from "react/jsx-runtime";
/** Per-channel hex → `rgba(r, g, b, alpha)` string (no color-science dep). */
export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** `roles.primary` at 12% alpha — the Android ripple color for every variant/tone. */
export function androidRippleColor(t = defaultTheme) {
  return hexToRgba(t.color.roles.primary, 0.12);
}

/** Background color for the filled variant per tone; `undefined` for text variant. */
export function resolveButtonBackground(variant, tone, t = defaultTheme) {
  if (variant !== 'filled') return undefined;
  if (tone === 'secondary') return t.color.roles.secondary;
  if (tone === 'error') return t.color.roles.error;
  return t.color.roles.primary;
}

/** Text color: filled → the tone's "on" color; text variant → the tone's accent color. */
export function resolveButtonTextColor(variant, tone, t = defaultTheme) {
  if (variant !== 'filled') {
    return tone === 'error' ? t.color.roles.error : t.color.roles.primary;
  }
  if (tone === 'secondary') return t.color.roles.onSecondary;
  if (tone === 'error') return t.color.roles.onError;
  return t.color.roles.onPrimary;
}
/** Pure container-style resolver — same matrix the component's `style` fn uses. */
export function resolveContainerStyle(opts) {
  const t = opts.theme ?? defaultTheme;
  const bg = resolveButtonBackground(opts.variant, opts.tone, t);
  return {
    height: opts.height,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...(opts.fullWidth ? {
      alignSelf: 'stretch'
    } : null),
    ...(bg ? {
      backgroundColor: bg
    } : null),
    ...(opts.platformOS === 'ios' && opts.pressed ? {
      opacity: 0.7
    } : null)
  };
}

/** Pure content (label) style resolver — disabled fades content only, 0.38. */
export function resolveContentStyle(variant, tone, disabled, t = defaultTheme) {
  return {
    fontSize: t.font.md,
    fontWeight: '600',
    color: resolveButtonTextColor(variant, tone, t),
    ...(disabled ? {
      opacity: t.disabled.contentOpacity
    } : null)
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
  theme
}) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;
  return /*#__PURE__*/_jsx(Pressable, {
    testID: testID,
    onPress: disabled ? undefined : onPress,
    disabled: disabled,
    accessibilityRole: "button",
    accessibilityState: {
      disabled
    },
    android_ripple: {
      color: androidRippleColor(t)
    },
    style: ({
      pressed
    }) => resolveContainerStyle({
      variant,
      tone,
      height,
      fullWidth,
      pressed,
      platformOS: Platform.OS,
      theme: t
    }),
    children: /*#__PURE__*/_jsx(Text, {
      style: resolveContentStyle(variant, tone, disabled, t),
      children: label
    })
  });
}
//# sourceMappingURL=PressableButton.js.map