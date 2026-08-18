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
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { tokens } from '../../tokens/tokens';
import type { Theme } from '../../theme/ThemeContext';
import { useTheme } from '../../theme/ThemeContext';

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
export function selectedRowBackground(t: Theme = tokens): string {
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
  theme,
}: SelectionIndicatorProps) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (control !== 'checkbox') return;
    Animated.timing(checkAnim, {
      toValue: selected ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [checkAnim, control, selected]);

  const outerStyle: ViewStyle = {
    width: size,
    height: size,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(control === 'radio'
      ? { borderRadius: size / 2 }
      : { borderRadius: t.radius.sm }),
    ...(selected
      ? { backgroundColor: t.color.roles.primary, borderColor: t.color.roles.primary }
      : { borderColor: t.color.roles.outline }),
  };

  if (control === 'radio') {
    return (
      <View testID={testID} style={outerStyle}>
        {selected && (
          <View
            testID={testID ? `${testID}-dot` : undefined}
            style={{
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: (size * 0.4) / 2,
              backgroundColor: t.color.roles.onPrimary,
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View testID={testID} style={outerStyle}>
      {selected && (
        <Animated.Text
          testID={testID ? `${testID}-check` : undefined}
          style={{
            color: t.color.roles.onPrimary,
            fontSize: Math.round(size * 0.72),
            lineHeight: size,
            opacity: checkAnim,
            transform: [{ scale: checkAnim }],
          }}
        >
          ✓
        </Animated.Text>
      )}
    </View>
  );
}

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
}: SelectionRowProps) {
  const contextTheme = useTheme();
  const t = theme ?? contextTheme;

  const rowStyle: StyleProp<ViewStyle> = {
    minHeight: 56,
    alignSelf: 'stretch',
    paddingHorizontal: t.spacing.md,
    ...(selected ? { backgroundColor: selectedRowBackground(t) } : null),
    ...(disabled ? { opacity: t.disabled.contentOpacity } : null),
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  };

  const labelStyle: TextStyle = {
    ...t.typography.bodyLarge,
    color: t.color.roles.onSurface,
    flexShrink: 1,
  };

  return (
    <Pressable
      testID={testID}
      style={rowStyle}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? control}
      accessibilityState={{ selected, disabled }}
    >
      <View style={contentStyle}>
        {children ?? (
          <>
            <SelectionIndicator control={control} selected={selected} theme={t} />
            {label !== undefined && <Text style={labelStyle}>{label}</Text>}
          </>
        )}
      </View>
    </Pressable>
  );
}
