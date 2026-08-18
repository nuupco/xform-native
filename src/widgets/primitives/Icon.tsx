/**
 * Icon primitives — zero-dependency chrome icons (design decision 10).
 *
 * The library has no icon runtime dependency (only the example app does).
 * `AlertIcon`/`PlusIcon` are plain View-based shape constructs. `LeafIcon` is
 * gated on the optional `react-native-svg` peer dep, falling back to a
 * `primaryContainer`-colored circle (same `require`-in-try pattern used by
 * `SignatureWidget`).
 */
import { View, Text, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/tokens';
import type { Theme } from '../../theme/ThemeContext';

export interface IconProps {
  testID?: string;
  color?: string;
  size?: number;
  /** Optional theme override (design decision 10); defaults to the raw `tokens` singleton. */
  theme?: Theme;
}

let _SvgModule: any | null = null;
let _svgLoaded: boolean | undefined;

function getSvg(): any | null {
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
  theme = tokens,
}: IconProps) {
  const resolvedColor = color ?? theme.color.roles.error;
  const barHeight = Math.round(size * 0.55);
  const barWidth = Math.max(2, Math.round(size * 0.14));
  const dotSize = barWidth;

  const container: ViewStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  return (
    <View testID={testID} style={container}>
      <View
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: resolvedColor,
          borderRadius: barWidth / 2,
        }}
      />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: resolvedColor,
          borderRadius: dotSize / 2,
        }}
      />
    </View>
  );
}

/** "+" glyph made from two overlapping bars. */
export function PlusIcon({
  testID,
  color,
  size = 20,
  theme = tokens,
}: IconProps) {
  const resolvedColor = color ?? theme.color.roles.primary;
  const thickness = Math.max(2, Math.round(size * 0.15));

  return (
    <View testID={testID} style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: (size - thickness) / 2,
          height: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: (size - thickness) / 2,
          width: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
        }}
      />
    </View>
  );
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
  theme = tokens,
}: IconProps) {
  const resolvedColor = color ?? theme.color.roles.primary;
  const svg = getSvg();

  if (!svg) {
    return (
      <View
        testID={testID}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.color.roles.primaryContainer,
        }}
      />
    );
  }

  const { Svg, Path } = svg;

  return (
    <View testID={testID} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 2C7 2 3 6 3 11c0 5.5 4.5 10 9 11 4.5-1 9-5.5 9-11 0-5-4-9-9-9z"
          fill={resolvedColor}
        />
      </Svg>
    </View>
  );
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
  theme = tokens,
}: IconProps) {
  const resolvedColor = color ?? theme.color.roles.primary;
  const thickness = Math.max(2, Math.round(size * 0.16));
  return (
    <View testID={testID} style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: size * 0.5,
          width: size * 0.32,
          height: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.32,
          top: size * 0.3,
          width: size * 0.56,
          height: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/** "−" glyph — a single horizontal bar. */
export function MinusIcon({
  testID,
  color,
  size = 20,
  theme = tokens,
}: IconProps) {
  const resolvedColor = color ?? theme.color.roles.onSurface;
  const thickness = Math.max(2, Math.round(size * 0.15));
  return (
    <View
      testID={testID}
      style={{ width: size, height: size, justifyContent: 'center' }}
    >
      <View
        style={{
          height: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
        }}
      />
    </View>
  );
}

function glyphIcon(glyph: string) {
  return function GlyphIconComponent({
    testID,
    color,
    size = 20,
    theme = tokens,
  }: IconProps) {
    const resolvedColor = color ?? theme.color.roles.onSurfaceVariant;
    return (
      <View
        testID={testID}
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: Math.round(size * 0.72),
            color: resolvedColor,
            lineHeight: size,
          }}
        >
          {glyph}
        </Text>
      </View>
    );
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
