"use strict";

/**
 * elevationStyle — merges a theme's elevation level into one ViewStyle
 * (design decision 1).
 *
 * iOS gets the raw shadow* props; Android gets a numeric `elevation`. Both
 * platforms additionally get a surface-tint `backgroundColor`, computed as
 * `mix(surface, primary, surfaceTint)` for the given level — a no-op tint
 * (equal to `surface`) at level 0.
 */
import { Platform } from 'react-native';
import { mix } from "./derive.js";
export function elevationStyle(t, level, opts) {
  const spec = t.elevation[level];
  const tintColor = opts?.tintOver ?? t.color.roles.primary;
  const backgroundColor = mix(t.color.roles.surface, tintColor, spec.surfaceTint);
  let platformStyle = {};
  if (Platform.OS === 'ios') {
    platformStyle = {
      shadowColor: spec.ios.shadowColor,
      shadowOffset: {
        width: spec.ios.shadowOffset.width,
        height: opts?.direction === 'up' ? -spec.ios.shadowOffset.height : spec.ios.shadowOffset.height
      },
      shadowOpacity: spec.ios.shadowOpacity,
      shadowRadius: spec.ios.shadowRadius
    };
  } else if (Platform.OS === 'android') {
    platformStyle = {
      elevation: spec.android
    };
  }
  return {
    ...platformStyle,
    backgroundColor
  };
}
//# sourceMappingURL=elevationStyle.js.map