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
import { tokens, type Tokens } from '../tokens/tokens';
import { deriveRoleSet } from './derive';

export type Theme = Tokens;

export interface ThemeOverride {
  color?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

/** @deprecated retained for existing call sites; prefer `ThemeOverride`. */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

const ROLE_KEYS = ['primary', 'secondary', 'tertiary'] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function mergeTheme(override?: ThemeOverride): Theme {
  const overrideColor = override?.color;
  if (!overrideColor) return tokens;

  const roles: Record<string, string> = { ...tokens.color.roles };
  let legacyPrimary: string = tokens.color.primary;

  for (const role of ROLE_KEYS) {
    const base = overrideColor[role as RoleKey];
    if (base === undefined) continue;

    const derived = deriveRoleSet(base);
    const cap = capitalize(role);
    roles[role] = derived.base;
    roles[`on${cap}`] = derived.on;
    roles[`${role}Container`] = derived.container;
    roles[`on${cap}Container`] = derived.onContainer;

    if (role === 'primary') {
      legacyPrimary = derived.base;
    }
  }

  return {
    ...tokens,
    color: {
      ...tokens.color,
      primary: legacyPrimary,
      roles,
    },
  } as Theme;
}
