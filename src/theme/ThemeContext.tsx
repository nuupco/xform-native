/**
 * ThemeContext — mount-time-only theming (design D1/D2, spec form-theming).
 *
 * - No provider present → useTheme() returns tokens defaults exactly.
 * - Theme is frozen at mount via useState(() => mergeTheme(...)); changing
 *   the `theme` prop without remounting does NOT propagate to already
 *   mounted widgets. This is closed product scope, not a defect.
 * - useThemedStyles caches per-theme-identity via a WeakMap so style object
 *   identity (and therefore snapshot output) stays stable across renders.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { tokens } from '../tokens/tokens';
import { mergeTheme, type Theme, type DeepPartial } from './theme';

export type { Theme };

const ThemeReactContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  theme?: DeepPartial<Theme>;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  // Frozen at mount: subsequent prop changes are intentionally ignored
  // (D1 — theming is not reactive). No effect/sync added on purpose.
  const [frozenTheme] = useState<Theme>(() => mergeTheme(theme));
  return (
    <ThemeReactContext.Provider value={frozenTheme}>{children}</ThemeReactContext.Provider>
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
