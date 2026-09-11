"use strict";

/**
 * SegmentedButton — two-option segmented control (design decision 5).
 *
 * Replaces the native RN `Switch` for Boolean's `default` variant: `Switch`
 * is native-rendered (only tintable, not M3-shaped) and its ~30dp thumb
 * fails the glove-use target. Pill radius, 44dp height. Selected segment =
 * `primaryContainer`/`onPrimaryContainer`; unselected = `surface` +
 * `outline` border. `value: null` (unanswered) shows NEITHER segment as
 * selected — distinct from an explicit "No" — which is the entire reason
 * this primitive exists instead of a boolean-only `Switch`.
 */
import { Pressable, Text, View } from 'react-native';
import { useTheme } from "../../theme/ThemeContext.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function SegmentedButton({
  options,
  value,
  onChange,
  disabled = false,
  testID,
  theme
}) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;
  const containerStyle = {
    flexDirection: 'row',
    height: 44,
    borderRadius: t.radius.pill,
    overflow: 'hidden',
    ...(disabled ? {
      opacity: t.disabled.contentOpacity
    } : null)
  };
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    style: containerStyle,
    children: options.map((option, index) => {
      const isSelected = value === option.value;
      const segmentStyle = {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        ...(index === 0 ? {
          borderTopLeftRadius: t.radius.pill,
          borderBottomLeftRadius: t.radius.pill
        } : {
          borderTopRightRadius: t.radius.pill,
          borderBottomRightRadius: t.radius.pill
        }),
        ...(isSelected ? {
          backgroundColor: t.color.roles.primaryContainer,
          borderColor: t.color.roles.primaryContainer
        } : {
          backgroundColor: t.color.roles.surface,
          borderColor: t.color.roles.outline
        })
      };
      const textStyle = {
        ...t.typography.labelLarge,
        color: isSelected ? t.color.roles.onPrimaryContainer : t.color.roles.onSurface
      };
      return /*#__PURE__*/_jsx(Pressable, {
        testID: testID ? `${testID}-segment-${option.value}` : undefined,
        style: segmentStyle,
        disabled: disabled,
        onPress: disabled ? undefined : () => onChange(option.value),
        accessibilityRole: "button",
        accessibilityState: {
          selected: isSelected,
          disabled
        },
        children: /*#__PURE__*/_jsx(Text, {
          style: textStyle,
          children: option.label
        })
      }, option.value);
    })
  });
}
//# sourceMappingURL=SegmentedButton.js.map