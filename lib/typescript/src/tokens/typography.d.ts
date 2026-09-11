/**
 * Typography roles — Material 3 "Campo" restyle, Phase 1.
 *
 * Flat RN TextStyle-shaped role objects. Structural, NOT themeable: a host
 * color override must never affect these values (spec: theming capability,
 * "Themeable vs. structural tokens").
 */
export declare const FONT_FAMILY: {
    readonly bricolage: "Bricolage Grotesque";
    readonly hanken: "Hanken Grotesk";
    readonly splineMono: "Spline Mono";
};
export interface TypographyRole {
    fontSize: number;
    lineHeight: number;
    fontWeight: number;
    fontFamily: string;
}
export declare const typography: {
    readonly headlineLarge: {
        readonly fontSize: 26;
        readonly lineHeight: 32;
        readonly fontWeight: 700;
        readonly fontFamily: "Bricolage Grotesque";
    };
    readonly headlineSmall: {
        readonly fontSize: 21;
        readonly lineHeight: 26;
        readonly fontWeight: 600;
        readonly fontFamily: "Bricolage Grotesque";
    };
    readonly titleLarge: {
        readonly fontSize: 18;
        readonly lineHeight: 24;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly titleMedium: {
        readonly fontSize: 16;
        readonly lineHeight: 22;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly titleSmall: {
        readonly fontSize: 14;
        readonly lineHeight: 20;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly bodyLarge: {
        readonly fontSize: 16;
        readonly lineHeight: 24;
        readonly fontWeight: 400;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly bodyMedium: {
        readonly fontSize: 14;
        readonly lineHeight: 20;
        readonly fontWeight: 400;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly bodySmall: {
        readonly fontSize: 13;
        readonly lineHeight: 18;
        readonly fontWeight: 400;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly labelLarge: {
        readonly fontSize: 14;
        readonly lineHeight: 20;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly labelMedium: {
        readonly fontSize: 12;
        readonly lineHeight: 16;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly labelSmall: {
        readonly fontSize: 11;
        readonly lineHeight: 14;
        readonly fontWeight: 600;
        readonly fontFamily: "Hanken Grotesk";
    };
    readonly mono: {
        readonly fontSize: 14;
        readonly lineHeight: 20;
        readonly fontWeight: 500;
        readonly fontFamily: "Spline Mono";
    };
};
export type Typography = typeof typography;
//# sourceMappingURL=typography.d.ts.map