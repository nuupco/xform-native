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
import { Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import type { Theme } from '../../theme/ThemeContext';
import { useTheme } from '../../theme/ThemeContext';

export interface SegmentedButtonOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedButtonProps<T extends string = string> {
  options: readonly [SegmentedButtonOption<T>, SegmentedButtonOption<T>];
  /** `null` = unanswered — neither segment renders as selected. */
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  testID?: string;
  theme?: Theme;
}

export function SegmentedButton<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  testID,
  theme,
}: SegmentedButtonProps<T>) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    height: 44,
    borderRadius: t.radius.pill,
    overflow: 'hidden',
    ...(disabled ? { opacity: t.disabled.contentOpacity } : null),
  };

  return (
    <View testID={testID} style={containerStyle}>
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const segmentStyle: ViewStyle = {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          ...(index === 0
            ? { borderTopLeftRadius: t.radius.pill, borderBottomLeftRadius: t.radius.pill }
            : { borderTopRightRadius: t.radius.pill, borderBottomRightRadius: t.radius.pill }),
          ...(isSelected
            ? {
                backgroundColor: t.color.roles.primaryContainer,
                borderColor: t.color.roles.primaryContainer,
              }
            : {
                backgroundColor: t.color.roles.surface,
                borderColor: t.color.roles.outline,
              }),
        };
        const textStyle: TextStyle = {
          ...t.typography.labelLarge,
          color: isSelected ? t.color.roles.onPrimaryContainer : t.color.roles.onSurface,
        };
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-segment-${option.value}` : undefined}
            style={segmentStyle}
            disabled={disabled}
            onPress={disabled ? undefined : () => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
          >
            <Text style={textStyle}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
