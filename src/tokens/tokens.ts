/**
 * Design tokens for @nuup/xform-native — Material 3 "Campo" restyle (Phase 1).
 * Plain JS object — no imports, no deps (REQ-17).
 *
 * Legacy flat property paths (`color.primary`, `spacing.md`, `radius.md`,
 * `font.md`, etc.) are RETAINED at the same keys and re-pointed to the new
 * Campo palette, so the 22 not-yet-migrated widgets get new visuals with zero
 * code changes (design: "Token surface" ADR).
 *
 * New M3 role set lives under `color.roles.*` (nested to avoid colliding with
 * legacy `surface`/`error`/`background`, whose legacy semantics differ from
 * the M3 role of the same name). `typography` and `elevation` are new
 * top-level groups; both are structural and MUST NOT be affected by a host
 * color override (see src/theme/theme.ts).
 */
import { typography } from './typography';
import { elevation } from './elevation';

export const tokens = {
  color: {
    // ── Legacy flat paths — same keys, Campo values ──────────────────────
    primary: '#265A36',
    background: '#FBF7EE',
    surface: '#FFFFFF',
    error: '#C0392B',
    text: '#1E1A14',

    // ── New M3 role set ───────────────────────────────────────────────────
    roles: {
      primary: '#265A36',
      onPrimary: '#F6FBEF',
      primaryContainer: '#D2E3D1',
      onPrimaryContainer: '#14301E',

      secondary: '#EFBE4E',
      onSecondary: '#2A2207',
      secondaryContainer: '#FBEFCF',
      onSecondaryContainer: '#1E1A14',

      tertiary: '#C25B3A',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#F7E5DC',
      onTertiaryContainer: '#1E1A14',

      error: '#C0392B',
      onError: '#FFFFFF',
      errorContainer: '#F7E1DE',
      onErrorContainer: '#1E1A14',

      background: '#FBF7EE',
      onBackground: '#1E1A14',
      surface: '#FFFFFF',
      onSurface: '#1E1A14',

      surfaceVariant: '#F4EDDD',
      onSurfaceVariant: '#4A4439',
      outline: '#CDBFA3',
      outlineVariant: '#E0D7C5',

      inverseSurface: '#1E1A14',
      inverseOnSurface: '#FBF7EE',
      scrim: 'rgba(30, 26, 20, 0.4)',
    },
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  font: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
  },
  typography,
  elevation,
  // Disabled-state opacities, derived rather than hardcoded per widget
  // (spec: "Disabled-state opacities").
  disabled: {
    contentOpacity: 0.38,
    containerOpacity: 0.12,
  },
} as const;

export type Tokens = typeof tokens;
