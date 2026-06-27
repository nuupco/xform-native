"use strict";

/**
 * Design tokens for @nuup/xform-native.
 * Plain JS object — no imports, no deps (REQ-17).
 *
 * Shape (per design ADR-1):
 *   color:   { primary, background, surface, error, text }
 *   spacing: { xs, sm, md, lg, xl }
 *   radius:  { sm, md, lg }
 *   font:    { xs, sm, md, lg, xl }
 */
export const tokens = {
  color: {
    primary: '#1976D2',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#D32F2F',
    text: '#212121'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16
  },
  font: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20
  }
};
//# sourceMappingURL=tokens.js.map