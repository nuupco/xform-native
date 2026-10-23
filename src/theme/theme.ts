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
import { tokens, type Tokens } from '../tokens/tokens';
import { deriveRoleSet } from './derive';

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
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

const ROLE_KEYS = ['primary', 'secondary', 'tertiary'] as const;
type RoleKey = (typeof ROLE_KEYS)[number];

const NEUTRAL_ROLE_KEYS = [
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
] as const;
type NeutralRoleKey = (typeof NEUTRAL_ROLE_KEYS)[number];

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

  const overrideNeutral = overrideColor.neutral;
  if (overrideNeutral) {
    for (const role of NEUTRAL_ROLE_KEYS) {
      const value = overrideNeutral[role as NeutralRoleKey];
      if (value === undefined) continue;
      roles[role] = value;
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
