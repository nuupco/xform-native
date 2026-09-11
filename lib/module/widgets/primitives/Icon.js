"use strict";

/**
 * Icon primitives — zero-dependency chrome icons (design decision 10).
 *
 * The library has no icon runtime dependency (only the example app does).
 * `AlertIcon`/`PlusIcon` are plain View-based shape constructs. `LeafIcon` is
 * gated on the optional `react-native-svg` peer dep, falling back to a
 * `primaryContainer`-colored circle (same `require`-in-try pattern used by
 * `SignatureWidget`).
 */
import { View, Text } from 'react-native';
import { useTheme, defaultTheme } from "../../theme/ThemeContext.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Calls `useTheme()` unconditionally (same hook every render, no rules-of-
 * hooks violation) but tolerates a broken/absent dispatcher by falling back
 * to `defaultTheme`. Needed because `Icon.test.tsx`'s `LeafIcon` fallback
 * test freshly `require()`s this module inside `jest.isolateModules`, which
 * gives the re-required `ThemeContext`/`react` a dispatcher-less module
 * instance — `useContext` throws there even outside any provider. Every
 * other render path (normal app usage, all other tests) resolves via the one
 * real `useTheme()` call as usual.
 */
function useIconTheme() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTheme();
  } catch {
    return defaultTheme;
  }
}
let _SvgModule = null;
let _svgLoaded;
function getSvg() {
  if (_svgLoaded === undefined) {
    try {
      _SvgModule = require('react-native-svg');
      _svgLoaded = true;
    } catch {
      _svgLoaded = false;
    }
  }
  return _SvgModule;
}

/** Solid alert/exclamation glyph — 16px default, single colored View "!" bar + dot. */
export function AlertIcon({
  testID,
  color,
  size = 16,
  theme
}) {
  const contextTheme = useIconTheme();
  const t = theme ?? contextTheme;
  const resolvedColor = color ?? t.color.roles.error;
  const barHeight = Math.round(size * 0.55);
  const barWidth = Math.max(2, Math.round(size * 0.14));
  const dotSize = barWidth;
  const container = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'space-between'
  };
  return /*#__PURE__*/_jsxs(View, {
    testID: testID,
    style: container,
    children: [/*#__PURE__*/_jsx(View, {
      style: {
        width: barWidth,
        height: barHeight,
        backgroundColor: resolvedColor,
        borderRadius: barWidth / 2
      }
    }), /*#__PURE__*/_jsx(View, {
      style: {
        width: dotSize,
        height: dotSize,
        backgroundColor: resolvedColor,
        borderRadius: dotSize / 2
      }
    })]
  });
}

/** "+" glyph made from two overlapping bars. */
export function PlusIcon({
  testID,
  color,
  size = 20,
  theme
}) {
  const contextTheme = useIconTheme();
  const t = theme ?? contextTheme;
  const resolvedColor = color ?? t.color.roles.primary;
  const thickness = Math.max(2, Math.round(size * 0.15));
  return /*#__PURE__*/_jsxs(View, {
    testID: testID,
    style: {
      width: size,
      height: size
    },
    children: [/*#__PURE__*/_jsx(View, {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: (size - thickness) / 2,
        height: thickness,
        backgroundColor: resolvedColor,
        borderRadius: thickness / 2
      }
    }), /*#__PURE__*/_jsx(View, {
      style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: (size - thickness) / 2,
        width: thickness,
        backgroundColor: resolvedColor,
        borderRadius: thickness / 2
      }
    })]
  });
}

/**
 * 64px leaf/sprout mark. Renders an `Svg`/`Path` leaf shape when
 * `react-native-svg` is installed; otherwise falls back to a
 * `primaryContainer`-colored circle so the layout footprint is preserved.
 */
export function LeafIcon({
  testID,
  color,
  size = 64,
  theme
}) {
  const contextTheme = useIconTheme();
  const t = theme ?? contextTheme;
  const resolvedColor = color ?? t.color.roles.primary;
  const svg = getSvg();
  if (!svg) {
    return /*#__PURE__*/_jsx(View, {
      testID: testID,
      style: {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.color.roles.primaryContainer
      }
    });
  }
  const {
    Svg,
    Path
  } = svg;
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    style: {
      width: size,
      height: size
    },
    children: /*#__PURE__*/_jsx(Svg, {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      children: /*#__PURE__*/_jsx(Path, {
        d: "M12 2C7 2 3 6 3 11c0 5.5 4.5 10 9 11 4.5-1 9-5.5 9-11 0-5-4-9-9-9z",
        fill: resolvedColor
      })
    })
  });
}

/**
 * Phase 3 icon expansion (design decision 9) — 17 new glyphs, all hand-rolled
 * from `View`/`Text` composition (zero `react-native-svg` dependency, same
 * technique as `AlertIcon`/`PlusIcon`). `react-native-svg` is confirmed
 * absent from `example/package.json`, so any svg-gated icon would silently
 * fall back to a shapeless circle in the only app exercising this library.
 *
 * Complex glyphs (chevron, question mark, arrows, grip) degrade to a `Text`
 * glyph child inside a sized `View`, matching `LeafIcon`'s fallback footprint
 * contract: the outer `View` is always `{ width: size, height: size }`.
 */

/** ✓ check glyph — two bars forming a checkmark, rotated via transform. */
export function CheckIcon({
  testID,
  color,
  size = 20,
  theme
}) {
  const contextTheme = useIconTheme();
  const t = theme ?? contextTheme;
  const resolvedColor = color ?? t.color.roles.primary;
  const thickness = Math.max(2, Math.round(size * 0.16));
  return /*#__PURE__*/_jsxs(View, {
    testID: testID,
    style: {
      width: size,
      height: size
    },
    children: [/*#__PURE__*/_jsx(View, {
      style: {
        position: 'absolute',
        left: size * 0.12,
        top: size * 0.5,
        width: size * 0.32,
        height: thickness,
        backgroundColor: resolvedColor,
        borderRadius: thickness / 2,
        transform: [{
          rotate: '45deg'
        }]
      }
    }), /*#__PURE__*/_jsx(View, {
      style: {
        position: 'absolute',
        left: size * 0.32,
        top: size * 0.3,
        width: size * 0.56,
        height: thickness,
        backgroundColor: resolvedColor,
        borderRadius: thickness / 2,
        transform: [{
          rotate: '-45deg'
        }]
      }
    })]
  });
}

/** "−" glyph — a single horizontal bar. */
export function MinusIcon({
  testID,
  color,
  size = 20,
  theme
}) {
  const contextTheme = useIconTheme();
  const t = theme ?? contextTheme;
  const resolvedColor = color ?? t.color.roles.onSurface;
  const thickness = Math.max(2, Math.round(size * 0.15));
  return /*#__PURE__*/_jsx(View, {
    testID: testID,
    style: {
      width: size,
      height: size,
      justifyContent: 'center'
    },
    children: /*#__PURE__*/_jsx(View, {
      style: {
        height: thickness,
        backgroundColor: resolvedColor,
        borderRadius: thickness / 2
      }
    })
  });
}
function glyphIcon(glyph) {
  return function GlyphIconComponent({
    testID,
    color,
    size = 20,
    theme
  }) {
    const contextTheme = useIconTheme();
    const t = theme ?? contextTheme;
    const resolvedColor = color ?? t.color.roles.onSurfaceVariant;
    return /*#__PURE__*/_jsx(View, {
      testID: testID,
      style: {
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: /*#__PURE__*/_jsx(Text, {
        style: {
          fontSize: Math.round(size * 0.72),
          color: resolvedColor,
          lineHeight: size
        },
        children: glyph
      })
    });
  };
}

/** ⌄ chevron-down glyph (SelectOne/SelectMulti trigger affordance). */
export const ChevronDownIcon = glyphIcon('⌄');
/** 🔍 magnifying-glass glyph (search bar affordance). */
export const SearchIcon = glyphIcon('⌕');
/** ▤ calendar glyph (Date/DateTime trigger affordance). */
export const CalendarIcon = glyphIcon('▤');
/** ◔ clock glyph (Time/DateTime trigger affordance). */
export const ClockIcon = glyphIcon('◔');
/** ⚹ camera glyph (Image capture affordance). */
export const CameraIcon = glyphIcon('◉');
/** mic glyph (Audio capture affordance). */
export const MicIcon = glyphIcon('●');
/** video-camera glyph (Video capture affordance). */
export const VideoIcon = glyphIcon('▶');
/** paperclip glyph (File capture affordance). */
export const PaperclipIcon = glyphIcon('⚭');
/** ? glyph (Unsupported/fallback widget). */
export const QuestionIcon = glyphIcon('?');
/** arrow-up glyph (Rank widget reorder control). */
export const ArrowUpIcon = glyphIcon('↑');
/** arrow-down glyph (Rank widget reorder control). */
export const ArrowDownIcon = glyphIcon('↓');
/** grip/drag-handle glyph (Rank widget drag affordance). */
export const GripIcon = glyphIcon('⣿');
/** map-pin glyph (Geo widget empty state / marker). */
export const MapPinIcon = glyphIcon('⚲');
/** recenter/target glyph (Geo map recenter action). */
export const TargetIcon = glyphIcon('◎');
/** download/offline-tiles glyph (Geo map download-tiles action). */
export const DownloadIcon = glyphIcon('⇩');
//# sourceMappingURL=Icon.js.map