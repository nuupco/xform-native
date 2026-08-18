/**
 * Typography roles — Material 3 "Campo" restyle, Phase 1.
 *
 * Flat RN TextStyle-shaped role objects. Structural, NOT themeable: a host
 * color override must never affect these values (spec: theming capability,
 * "Themeable vs. structural tokens").
 */
export const FONT_FAMILY = {
  bricolage: 'Bricolage Grotesque',
  hanken: 'Hanken Grotesk',
  splineMono: 'Spline Mono',
} as const;

export interface TypographyRole {
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily: string;
}

export const typography = {
  headlineLarge: { fontSize: 26, lineHeight: 32, fontWeight: 700, fontFamily: FONT_FAMILY.bricolage },
  headlineSmall: { fontSize: 21, lineHeight: 26, fontWeight: 600, fontFamily: FONT_FAMILY.bricolage },
  titleLarge: { fontSize: 18, lineHeight: 24, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  titleMedium: { fontSize: 16, lineHeight: 22, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: 400, fontFamily: FONT_FAMILY.hanken },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: 400, fontFamily: FONT_FAMILY.hanken },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: 400, fontFamily: FONT_FAMILY.hanken },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: 600, fontFamily: FONT_FAMILY.hanken },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: 500, fontFamily: FONT_FAMILY.splineMono },
} as const;

export type Typography = typeof typography;
