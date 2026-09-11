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
export interface ElevationLevel {
    ios: {
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
    };
    android: number;
    surfaceTint: number;
}
export declare const elevation: Record<0 | 1 | 2 | 3 | 4 | 5, ElevationLevel>;
export type Elevation = typeof elevation;
//# sourceMappingURL=elevation.d.ts.map