/**
 * FontGate — loads the Campo typography's bundled font families and always
 * renders its children immediately, falling back to the platform's default
 * font while loading (never a blank screen, never a stuck loading state).
 *
 * The three families are shipped as variable-weight TTFs (Google Fonts'
 * `ofl/` folder has no static per-weight cut for any of them at time of
 * writing), registered once each under the exact family-name string
 * `@nuup/xform-native`'s typography roles reference (see
 * src/tokens/typography.ts's FONT_FAMILY map). RN's `fontWeight` style prop
 * is applied on top by each Text usage; iOS reliably renders the requested
 * weight from a variable font, Android support varies by OS version — this
 * is a known platform limitation, not a bug in this loader.
 */
import { useFonts } from 'expo-font';
import { Fragment, type ReactNode } from 'react';

export function FontGate({ children }: { children: ReactNode }) {
  const [, error] = useFonts({
    'Bricolage Grotesque': require('../../assets/fonts/BricolageGrotesque-Variable.ttf'),
    'Hanken Grotesk': require('../../assets/fonts/HankenGrotesk-Variable.ttf'),
    'Spline Mono': require('../../assets/fonts/SplineSansMono-Medium.ttf'),
  });

  if (error && __DEV__) {
    console.error('[FontGate] Failed to load bundled fonts, falling back to system font:', error);
  }

  return <Fragment>{children}</Fragment>;
}
