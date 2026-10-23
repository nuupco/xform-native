/**
 * Theme type + derivation-aware merge over tokens.ts (design D1/D2, "Interfaces").
 *
 * `Theme` is structurally identical to `Tokens`. `ThemeOverride` narrows the
 * host-facing surface to `color.primary/secondary/tertiary` plus
 * `color.neutral` only — hosts cannot override typography, elevation,
 * spacing, radius, or font (spec: "Themeable vs. structural tokens"). Each
 * overridden `primary/secondary/tertiary` role auto-derives its own
 * container/on-* roles via `deriveRoleSet` (fixed-percentage sRGB mix,
 * zero-dep). The derived primary role is also mirrored back onto the legacy
 * `color.primary` path so unmigrated widgets honor the override too.
 *
 * `color.neutral` is different: it carries the literal surface/text roles
 * (`background`, `onBackground`, `surface`, `onSurface`, `surfaceVariant`,
 * `onSurfaceVariant`, `outline`, `outlineVariant`) a host supplies directly,
 * one role at a time. These are NOT run through `deriveRoleSet` — a dark
 * palette's `onSurface` isn't derivable from its `surface` the way a brand
 * color's container shade is from its base — so each provided value is
 * merged straight into `color.roles` under its own key, same key, no
 * transformation. Omitting `color.neutral` entirely leaves every one of
 * these roles at its `tokens.ts` default, byte-identical to today's output.
 */
import { type Tokens } from '../tokens/tokens.js';
export type Theme = Tokens;
export interface ThemeOverride {
    color?: {
        primary?: string;
        secondary?: string;
        tertiary?: string;
        neutral?: {
            background?: string;
            onBackground?: string;
            surface?: string;
            onSurface?: string;
            surfaceVariant?: string;
            onSurfaceVariant?: string;
            outline?: string;
            outlineVariant?: string;
        };
    };
}
/** @deprecated retained for existing call sites; prefer `ThemeOverride`. */
export type DeepPartial<T> = T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;
export declare function mergeTheme(override?: ThemeOverride): Theme;
//# sourceMappingURL=theme.d.ts.map