"use strict";

/**
 * SelectionRow / SelectionIndicator — shared M3 selection row primitive
 * (design decision 3/4).
 *
 * Extracted from 12 near-identical row renderers duplicated across
 * SelectOne's 7 appearance variants and SelectMulti's 6. `SelectionRow` is
 * a full-width, 56dp min-height `Pressable` — the ENTIRE row is the hit
 * target, not just the indicator. `SelectionIndicator` renders the visual
 * marker (circle for `control:'radio'`, square for `control:'checkbox'`)
 * and ships inside this module (decision 4) but is also exported directly
 * so Boolean's checkbox variant and Trigger can consume just the indicator
 * without the row shell.
 *
 * RN Fabric layout footgun (design risk table): padding and centering are
 * kept on SEPARATE nested nodes here — the outer Pressable owns padding via
 * `paddingHorizontal`, while `alignItems`/`justifyContent` live one level in
 * on the row's inner content View — so a padded, centered, min-height row
 * never collapses its label Text on Fabric.
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme, defaultTheme } from "../../theme/ThemeContext.js";
import { MarkdownText } from "../../text/MarkdownText.js";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/** `primaryContainer` at 40% alpha — selected SelectionRow's tinted background (decision 3). */
export function selectedRowBackground(t = defaultTheme) {
  // 40% alpha in hex is 0x66 (102/255 ≈ 0.4).
  return `${t.color.roles.primaryContainer}66`;
}

/**
 * SelectionIndicator — radio (circle) or checkbox (square) marker.
 *
 * Radio: 20dp circle, 2px `outline` border resting; selected = `primary`
 * fill + `onPrimary` dot.
 * Checkbox: square (`radius.sm`), 2px `outline` border resting; selected =
 * `primary` background + `onPrimary` check, animated via a 150ms
 * `Animated.timing` check-draw (opacity/scale of the check glyph).
 */
export function SelectionIndicator({
  control,
  selected,
  testID,
  size = 20,
  theme
}) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    if (control !== 'checkbox') return;
    Animated.timing(checkAnim, {
      toValue: selected ? 1 : 0,
      duration: 150,
      useNativeDriver: true
    }).start();
  }, [checkAnim, control, selected]);
  const outerStyle = {
    width: size,
    height: size,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(control === 'radio' ? {
      borderRadius: size / 2
    } : {
      borderRadius: t.radius.sm
    }),
    ...(selected ? {
      backgroundColor: t.color.roles.primary,
      borderColor: t.color.roles.primary
    } : {
      borderColor: t.color.roles.outline
    })
  };
  if (control === 'radio') {
    return /*#__PURE__*/_jsx(View, {
      testID: testID,
      style: outerStyle,
      children: selected && /*#__PURE__*/_jsx(View, {
        testID: testID ? `${testID}-dot` : undefined,
        style: {
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: size * 0.4 / 2,
          backgroundColor: t.color.roles.onPrimary
        }
      })
    });
  }
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    style: outerStyle,
    children: selected && /*#__PURE__*/_jsx(Animated.Text, {
      testID: testID ? `${testID}-check` : undefined,
      style: {
        color: t.color.roles.onPrimary,
        fontSize: Math.round(size * 0.72),
        lineHeight: size,
        opacity: checkAnim,
        transform: [{
          scale: checkAnim
        }]
      },
      children: "\u2713"
    })
  });
}
/**
 * SelectionRow — full-width, 56dp min-height Pressable row wrapping a
 * SelectionIndicator + label (or arbitrary `children` content slot for
 * callers that need a custom center layout, e.g. Rank's grip/number/text
 * shell reusing just the row chrome with `control` semantics ignored).
 */
export function SelectionRow({
  control,
  selected,
  onPress,
  label,
  disabled = false,
  testID,
  accessibilityRole,
  theme,
  children,
  density = 'default'
}) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;
  const isLikert = density === 'likert';
  const rowStyle = {
    ...(density === 'pack' ? {
      minHeight: 40,
      alignSelf: 'stretch',
      paddingHorizontal: t.spacing.sm
    } : isLikert ? {
      minHeight: 48,
      minWidth: 64,
      paddingHorizontal: t.spacing.xs
    } : {
      minHeight: 56,
      alignSelf: 'stretch',
      paddingHorizontal: t.spacing.md
    }),
    ...(selected && !isLikert ? {
      backgroundColor: selectedRowBackground(t)
    } : null),
    ...(disabled ? {
      opacity: t.disabled.contentOpacity
    } : null)
  };
  const contentStyle = isLikert ? {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xs
  } : {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm
  };
  const labelStyle = isLikert ? {
    ...t.typography.bodySmall,
    color: t.color.roles.onSurface,
    textAlign: 'center'
  } : {
    ...t.typography.bodyLarge,
    color: t.color.roles.onSurface,
    flexShrink: 1
  };
  return /*#__PURE__*/_jsx(Pressable, {
    testID: testID,
    style: rowStyle,
    onPress: disabled ? undefined : onPress,
    disabled: disabled,
    accessibilityRole: accessibilityRole ?? control,
    accessibilityState: control === 'checkbox' ? {
      checked: selected,
      disabled
    } : {
      selected,
      disabled
    },
    children: /*#__PURE__*/_jsx(View, {
      style: contentStyle,
      children: children ?? (isLikert ? /*#__PURE__*/_jsxs(_Fragment, {
        children: [label !== undefined && /*#__PURE__*/_jsx(MarkdownText, {
          value: label,
          baseStyle: labelStyle
        }), /*#__PURE__*/_jsx(SelectionIndicator, {
          control: control,
          selected: selected,
          theme: t
        })]
      }) : /*#__PURE__*/_jsxs(_Fragment, {
        children: [/*#__PURE__*/_jsx(SelectionIndicator, {
          control: control,
          selected: selected,
          theme: t
        }), label !== undefined && /*#__PURE__*/_jsx(MarkdownText, {
          value: label,
          baseStyle: labelStyle
        })]
      }))
    })
  });
}
//# sourceMappingURL=SelectionRow.js.map