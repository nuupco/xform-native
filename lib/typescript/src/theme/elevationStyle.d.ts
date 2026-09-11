/**
 * elevationStyle — merges a theme's elevation level into one ViewStyle
 * (design decision 1).
 *
 * iOS gets the raw shadow* props; Android gets a numeric `elevation`. Both
 * platforms additionally get a surface-tint `backgroundColor`, computed as
 * `mix(surface, primary, surfaceTint)` for the given level — a no-op tint
 * (equal to `surface`) at level 0.
 */
import { type ViewStyle } from 'react-native';
import type { Theme } from './theme.js';
export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;
export interface ElevationStyleOpts {
    /** 'up' negates the iOS shadowOffset.height (nav-row-style upward shadow). */
    direction?: 'up' | 'down';
    /** Override the color tinted over the surface (defaults to theme primary). */
    tintOver?: string;
}
export declare function elevationStyle(t: Theme, level: ElevationLevel, opts?: ElevationStyleOpts): ViewStyle;
//# sourceMappingURL=elevationStyle.d.ts.map