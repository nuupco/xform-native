/**
 * Zero-dependency sRGB color derivation helpers (design: derivation ADR).
 *
 * Fixed-percentage channel mixing + WCAG relative luminance — no color-science
 * dependency (REQ-17). Used by `deriveRoleSet` to compute on/container roles
 * for a host-overridden primary/secondary/tertiary color.
 */
export type Hex = string;

const DARK_INK = '#1A1C18';
const LIGHT_INK = '#FFFFFF';

function parseHex(hex: Hex): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): Hex {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const c = (v: number) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Per-channel sRGB lerp from `a` toward `b` by `t` (0..1), rounded. */
export function mix(a: Hex, b: Hex, t: number): Hex {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** WCAG relative luminance (0..1) of a hex color. */
export function luminance(hex: Hex): number {
  const [r, g, b] = parseHex(hex);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Ink color for text/icons on top of `hex`: dark ink on light bases, white on dark bases. */
export function onColor(hex: Hex): Hex {
  return luminance(hex) > 0.5 ? DARK_INK : LIGHT_INK;
}

export interface RoleSet {
  base: Hex;
  on: Hex;
  container: Hex;
  onContainer: Hex;
}

/** Derives the full {base,on,container,onContainer} role quartet from a single base color. */
export function deriveRoleSet(base: Hex): RoleSet {
  return {
    base,
    on: onColor(base),
    container: mix(base, '#FFFFFF', 0.86),
    onContainer: mix(base, '#000000', 0.68),
  };
}
