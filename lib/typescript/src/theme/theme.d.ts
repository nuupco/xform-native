/**
 * Theme type + derivation-aware merge over tokens.ts (design D1/D2, "Interfaces").
 *
 * `Theme` is structurally identical to `Tokens`. `ThemeOverride` narrows the
 * host-facing surface to `color.primary/secondary/tertiary` only — hosts
 * cannot override typography, elevation, spacing, radius, or font (spec:
 * "Themeable vs. structural tokens"). Each overridden role auto-derives its
 * own container/on-* roles via `deriveRoleSet` (fixed-percentage sRGB mix,
 * zero-dep). The derived primary role is also mirrored back onto the legacy
 * `color.primary` path so unmigrated widgets honor the override too.
 */
import { type Tokens } from '../tokens/tokens.js';
export type Theme = Tokens;
export interface ThemeOverride {
    color?: {
        primary?: string;
        secondary?: string;
        tertiary?: string;
    };
}
/** @deprecated retained for existing call sites; prefer `ThemeOverride`. */
export type DeepPartial<T> = T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;
export declare function mergeTheme(override?: ThemeOverride): Theme;
//# sourceMappingURL=theme.d.ts.map