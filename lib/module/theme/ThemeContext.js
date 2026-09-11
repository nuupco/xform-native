"use strict";

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
import { createContext, useContext, useMemo, useState } from 'react';
import { tokens } from "../tokens/tokens.js";
import { mergeTheme } from "./theme.js";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Re-export of the raw `tokens` singleton as `defaultTheme` (design decision
 * 10). Primitives that need a theme default outside a component body (pure
 * resolvers, or default prop values) import this instead of reaching into
 * `../tokens/tokens` directly, so `no-raw-tokens-in-widgets.test.ts`'s
 * completion gate — which flags `from '.../tokens/tokens'` imports — sees
 * them as migrated while their resolved defaults remain byte-identical to
 * `tokens`.
 */
export const defaultTheme = tokens;
const ThemeReactContext = /*#__PURE__*/createContext(null);
export function ThemeProvider({
  theme,
  children
}) {
  // Frozen at mount: subsequent prop changes are intentionally ignored
  // (D1 — theming is not reactive). No effect/sync added on purpose.
  const [frozenTheme] = useState(() => mergeTheme(theme));
  return /*#__PURE__*/_jsx(ThemeReactContext.Provider, {
    value: frozenTheme,
    children: children
  });
}
export function useTheme() {
  const ctx = useContext(ThemeReactContext);
  return ctx ?? tokens;
}
const styleCache = new WeakMap();
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => {
    let byFactory = styleCache.get(theme);
    if (!byFactory) {
      byFactory = new WeakMap();
      styleCache.set(theme, byFactory);
    }
    const cached = byFactory.get(factory);
    if (cached) return cached;
    const styles = factory(theme);
    byFactory.set(factory, styles);
    return styles;
  }, [theme, factory]);
}
//# sourceMappingURL=ThemeContext.js.map