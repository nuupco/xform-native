/**
 * Theme type + deep-merge over tokens.ts (design D1/D2).
 *
 * `Theme` is structurally identical to `Tokens`; `mergeTheme` deep-merges a
 * partial override on top of the zero-dep `tokens` default. tokens.ts itself
 * is untouched and keeps working standalone with no provider.
 */
import { tokens, type Tokens } from '../tokens/tokens';

export type Theme = Tokens;

type Widen<T> = T extends string ? string : T extends number ? number : T;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : Widen<T[K]>;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) return base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override)) {
    const baseValue = (base as Record<string, unknown>)[key];
    const overrideValue = (override as Record<string, unknown>)[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue as DeepPartial<typeof baseValue>);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }
  return result as T;
}

export function mergeTheme(p?: DeepPartial<Theme>): Theme {
  return deepMerge(tokens as Theme, p);
}
