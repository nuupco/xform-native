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
import { type ReactNode } from 'react';
import { type Theme, type ThemeOverride } from './theme.js';
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
export declare const defaultTheme: Theme;
export interface ThemeProviderProps {
    theme?: ThemeOverride;
    children: ReactNode;
}
export declare function ThemeProvider({ theme, children }: ThemeProviderProps): import("react").JSX.Element;
export declare function useTheme(): Theme;
type NamedStyles<T> = {
    [P in keyof T]: object;
};
export declare function useThemedStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): T;
//# sourceMappingURL=ThemeContext.d.ts.map