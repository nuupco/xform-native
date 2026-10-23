import { tokens } from '../../tokens/tokens';
import { mergeTheme } from '../../theme/theme';
import { deriveRoleSet } from '../../theme/derive';

describe('mergeTheme — no override', () => {
  it('deep-equals tokens', () => {
    expect(mergeTheme()).toEqual(tokens);
    expect(mergeTheme({})).toEqual(tokens);
  });
});

describe('mergeTheme — primary override', () => {
  const OVERRIDE = '#7B2CBF';
  const theme = mergeTheme({ color: { primary: OVERRIDE } });
  const expected = deriveRoleSet(OVERRIDE);

  it('recomputes color.roles.primary and its derived roles', () => {
    expect(theme.color.roles.primary).toBe(OVERRIDE);
    expect(theme.color.roles.onPrimary).toBe(expected.on);
    expect(theme.color.roles.primaryContainer).toBe(expected.container);
    expect(theme.color.roles.onPrimaryContainer).toBe(expected.onContainer);
  });

  it('mirrors the derived primary back onto legacy color.primary', () => {
    expect(theme.color.primary).toBe(OVERRIDE);
  });

  it('leaves typography untouched (structural non-themeability)', () => {
    expect(theme.typography).toEqual(tokens.typography);
  });

  it('leaves elevation untouched (structural non-themeability)', () => {
    expect(theme.elevation).toEqual(tokens.elevation);
  });

  it('leaves spacing/radius/font untouched', () => {
    expect(theme.spacing).toEqual(tokens.spacing);
    expect(theme.radius).toEqual(tokens.radius);
    expect(theme.font).toEqual(tokens.font);
  });

  it('leaves unrelated color roles (secondary/tertiary) untouched', () => {
    expect(theme.color.roles.secondary).toBe(tokens.color.roles.secondary);
    expect(theme.color.roles.tertiary).toBe(tokens.color.roles.tertiary);
  });
});

describe('mergeTheme — secondary and tertiary overrides', () => {
  it('derives secondary role set independently', () => {
    const theme = mergeTheme({ color: { secondary: '#336699' } });
    const expected = deriveRoleSet('#336699');
    expect(theme.color.roles.secondary).toBe('#336699');
    expect(theme.color.roles.onSecondary).toBe(expected.on);
    expect(theme.color.roles.secondaryContainer).toBe(expected.container);
    expect(theme.color.roles.onSecondaryContainer).toBe(expected.onContainer);
    // legacy color.primary is untouched when only secondary is overridden
    expect(theme.color.primary).toBe(tokens.color.primary);
  });

  it('derives tertiary role set independently', () => {
    const theme = mergeTheme({ color: { tertiary: '#992244' } });
    const expected = deriveRoleSet('#992244');
    expect(theme.color.roles.tertiary).toBe('#992244');
    expect(theme.color.roles.onTertiary).toBe(expected.on);
    expect(theme.color.roles.tertiaryContainer).toBe(expected.container);
    expect(theme.color.roles.onTertiaryContainer).toBe(expected.onContainer);
  });
});

describe('mergeTheme — neutral (surface/text) overrides', () => {
  it('merges each provided neutral role literally into color.roles (no derivation)', () => {
    const theme = mergeTheme({
      color: {
        neutral: {
          background: '#0A0A0A',
          onBackground: '#EAEAEA',
          surface: '#111111',
          onSurface: '#F0F0F0',
          surfaceVariant: '#1A1A1A',
          onSurfaceVariant: '#CCCCCC',
          outline: '#555555',
          outlineVariant: '#333333',
        },
      },
    });
    expect(theme.color.roles.background).toBe('#0A0A0A');
    expect(theme.color.roles.onBackground).toBe('#EAEAEA');
    expect(theme.color.roles.surface).toBe('#111111');
    expect(theme.color.roles.onSurface).toBe('#F0F0F0');
    expect(theme.color.roles.surfaceVariant).toBe('#1A1A1A');
    expect(theme.color.roles.onSurfaceVariant).toBe('#CCCCCC');
    expect(theme.color.roles.outline).toBe('#555555');
    expect(theme.color.roles.outlineVariant).toBe('#333333');
  });

  it('merges only the provided neutral roles, leaving the rest at their default', () => {
    const theme = mergeTheme({ color: { neutral: { onSurface: '#FFFFFF' } } });
    expect(theme.color.roles.onSurface).toBe('#FFFFFF');
    expect(theme.color.roles.background).toBe(tokens.color.roles.background);
    expect(theme.color.roles.surface).toBe(tokens.color.roles.surface);
  });

  it('does not affect primary/secondary/tertiary roles or legacy color.primary', () => {
    const theme = mergeTheme({ color: { neutral: { surface: '#202020' } } });
    expect(theme.color.roles.primary).toBe(tokens.color.roles.primary);
    expect(theme.color.primary).toBe(tokens.color.primary);
  });

  it('omitting color.neutral is byte-identical to today\'s default output', () => {
    expect(mergeTheme()).toEqual(tokens);
    expect(mergeTheme({ color: { primary: '#7B2CBF' } }).color.roles.background).toBe(
      tokens.color.roles.background
    );
  });
});

describe('mergeTheme — disallowed override keys are ignored', () => {
  it('ignores a typography override even if passed', () => {
    const theme = mergeTheme({
      color: { primary: '#111111' },
      // @ts-expect-error — typography is not part of ThemeOverride
      typography: { bodyMedium: { fontSize: 999 } },
    });
    expect(theme.typography).toEqual(tokens.typography);
  });
});
