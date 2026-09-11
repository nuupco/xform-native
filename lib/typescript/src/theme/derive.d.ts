/**
 * Zero-dependency sRGB color derivation helpers (design: derivation ADR).
 *
 * Fixed-percentage channel mixing + WCAG relative luminance — no color-science
 * dependency (REQ-17). Used by `deriveRoleSet` to compute on/container roles
 * for a host-overridden primary/secondary/tertiary color.
 */
export type Hex = string;
/** Per-channel sRGB lerp from `a` toward `b` by `t` (0..1), rounded. */
export declare function mix(a: Hex, b: Hex, t: number): Hex;
/** WCAG relative luminance (0..1) of a hex color. */
export declare function luminance(hex: Hex): number;
/** Ink color for text/icons on top of `hex`: dark ink on light bases, white on dark bases. */
export declare function onColor(hex: Hex): Hex;
export interface RoleSet {
    base: Hex;
    on: Hex;
    container: Hex;
    onContainer: Hex;
}
/** Derives the full {base,on,container,onContainer} role quartet from a single base color. */
export declare function deriveRoleSet(base: Hex): RoleSet;
//# sourceMappingURL=derive.d.ts.map