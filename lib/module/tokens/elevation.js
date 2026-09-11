"use strict";

/**
 * Elevation levels — Material 3 "Campo" restyle, Phase 1.
 *
 * Levels 0-5, each with iOS shadow props, an Android elevation number, and a
 * surface-tint percentage (primary blended over surface). Structural, NOT
 * themeable (spec: theming capability, "Themeable vs. structural tokens").
 *
 * 0 = flat/none · 1 = widget card resting · 2 = input focus / pressed row / nav bar
 * 3 = dropdown / date picker · 4 = fullscreen map/media modal · 5 = GPS permission dialog
 */

export const elevation = {
  0: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 0
      },
      shadowOpacity: 0,
      shadowRadius: 0
    },
    android: 0,
    surfaceTint: 0
  },
  1: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 1
      },
      shadowOpacity: 0.08,
      shadowRadius: 2
    },
    android: 1,
    surfaceTint: 0.05
  },
  2: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 1
      },
      shadowOpacity: 0.12,
      shadowRadius: 3
    },
    android: 3,
    surfaceTint: 0.08
  },
  3: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.16,
      shadowRadius: 6
    },
    android: 6,
    surfaceTint: 0.11
  },
  4: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.2,
      shadowRadius: 10
    },
    android: 8,
    surfaceTint: 0.12
  },
  5: {
    ios: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 6
      },
      shadowOpacity: 0.24,
      shadowRadius: 14
    },
    android: 12,
    surfaceTint: 0.14
  }
};
//# sourceMappingURL=elevation.js.map