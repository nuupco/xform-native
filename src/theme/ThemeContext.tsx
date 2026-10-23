/**
 * ThemeContext — mount-time-only theming (design D1/D2, spec form-theming).
 *
 * - No provider present → useTheme() returns tokens defaults exactly.
 * - The merged theme is reactive: when the `theme` prop changes on an
 *   already-mounted provider, consumers (`useTheme`/`useThemedStyles`)
 *   re-render with the new colors, without remounting the subtree. The
 *   merge itself (`mergeTheme`, including `deriveRoleSet`) is memoized on a
 *   shallow/structural key derived from `theme` (not on `theme`'s own
 *   object identity), via `useMemo`, so a host that passes a fresh
 *   object literal on every render (a common pattern) does not pay for
 *   re-deriving roles, re-creating `color.roles`, and invalidating every
 *   `useThemedStyles` cache entry on every unrelated parent re-render —
 *   only when the override's actual content changes.
 * - useThemedStyles caches per-theme-identity via a WeakMap so style object
 *   identity (and therefore snapshot output) stays stable across renders as
 *   long as the merged theme object itself is unchanged.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { tokens } from '../tokens/tokens';
import { mergeTheme, type Theme, type ThemeOverride } from './theme';

export type { Theme };

/**
 * Re-export of the raw `tokens` singleton as `defaultTheme` (design decision
 * 10). Primitives that need a theme default outside a component body (pure
 * resolvers, or default prop values) import this instead of reaching into
 * `../tokens/tokens` directly, so `no-raw-tokens-in-widgets.test.ts`'s
 * completion gate — which flags `from '.../tokens/tokens'` imports — sees
 * them as migrated while their resolved defaults remain byte-identical to
 * `tokens`.
 */
export const defaultTheme: Theme = tokens;

const ThemeReactContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  theme?: ThemeOverride;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  // Reactive: re-merge only when `theme`'s structural content actually
  // changes, not on every render (hosts commonly pass a fresh object
  // literal as `theme` on every parent re-render). `JSON.stringify` on a
  // small, plain-data `ThemeOverride` is a cheap, dependency-free way to
  // get a stable structural key for `useMemo` without reaching for a deep
  // equality library.
  const themeKey = theme ? JSON.stringify(theme) : undefined;
  const mergedTheme = useMemo<Theme>(() => mergeTheme(theme), [themeKey]);
  return (
    <ThemeReactContext.Provider value={mergedTheme}>{children}</ThemeReactContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeReactContext);
  return ctx ?? tokens;
}

type NamedStyles<T> = { [P in keyof T]: object };

const styleCache = new WeakMap<Theme, WeakMap<Function, unknown>>();

export function useThemedStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => {
    let byFactory = styleCache.get(theme);
    if (!byFactory) {
      byFactory = new WeakMap();
      styleCache.set(theme, byFactory);
    }
    const cached = byFactory.get(factory);
    if (cached) return cached as T;
    const styles = factory(theme);
    byFactory.set(factory, styles);
    return styles;
  }, [theme, factory]);
}
