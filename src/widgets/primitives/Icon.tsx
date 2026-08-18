/**
 * Icon primitives — zero-dependency chrome icons (design decision 10).
 *
 * The library has no icon runtime dependency (only the example app does).
 * `AlertIcon`/`PlusIcon` are plain View-based shape constructs. `LeafIcon` is
 * gated on the optional `react-native-svg` peer dep, falling back to a
 * `primaryContainer`-colored circle (same `require`-in-try pattern used by
 * `SignatureWidget`).
 */
import { View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/tokens';

export interface IconProps {
  testID?: string;
  color?: string;
  size?: number;
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
export function AlertIcon({ testID, color = tokens.color.roles.error, size = 16 }: IconProps) {
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
          backgroundColor: color,
          borderRadius: barWidth / 2,
        }}
      />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: color,
          borderRadius: dotSize / 2,
        }}
      />
    </View>
  );
}

/** "+" glyph made from two overlapping bars. */
export function PlusIcon({ testID, color = tokens.color.roles.primary, size = 20 }: IconProps) {
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
          backgroundColor: color,
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
          backgroundColor: color,
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
  color = tokens.color.roles.primary,
  size = 64,
}: IconProps) {
  const svg = getSvg();

  if (!svg) {
    return (
      <View
        testID={testID}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tokens.color.roles.primaryContainer,
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
          fill={color}
        />
      </Svg>
    </View>
  );
}
