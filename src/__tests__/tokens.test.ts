import { tokens } from '../../src/index';

describe('tokens', () => {
  it('is a plain object (no function call needed)', () => {
    expect(typeof tokens).toBe('object');
    expect(tokens).not.toBeNull();
  });

  describe('legacy color paths — re-pointed to Campo values', () => {
    it('primary', () => expect(tokens.color.primary).toBe('#265A36'));
    it('background', () => expect(tokens.color.background).toBe('#FBF7EE'));
    it('surface', () => expect(tokens.color.surface).toBe('#FFFFFF'));
    it('error', () => expect(tokens.color.error).toBe('#C0392B'));
    it('text', () => expect(tokens.color.text).toBe('#1E1A14'));
  });

  describe('legacy spacing — superset with Campo values', () => {
    it.each([
      ['xxs', 2],
      ['xs', 4],
      ['sm', 8],
      ['md', 16],
      ['lg', 24],
      ['xl', 32],
      ['xxl', 48],
    ] as const)('%s is %d', (key, value) => {
      expect(tokens.spacing[key]).toBe(value);
    });
  });

  describe('legacy radius — superset with Campo values', () => {
    it.each([
      ['sm', 6],
      ['md', 10],
      ['lg', 16],
      ['xl', 24],
      ['pill', 999],
    ] as const)('%s is %d', (key, value) => {
      expect(tokens.radius[key]).toBe(value);
    });
  });

  describe('legacy font — numeric scale retained', () => {
    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('%s is a positive number', (key) => {
      expect(typeof tokens.font[key]).toBe('number');
      expect(tokens.font[key]).toBeGreaterThan(0);
    });
  });

  describe('color.roles — full M3 role set, exact spec values', () => {
    it.each([
      ['primary', '#265A36'],
      ['onPrimary', '#F6FBEF'],
      ['primaryContainer', '#D2E3D1'],
      ['onPrimaryContainer', '#14301E'],
      ['secondary', '#EFBE4E'],
      ['onSecondary', '#2A2207'],
      ['secondaryContainer', '#FBEFCF'],
      ['tertiary', '#C25B3A'],
      ['tertiaryContainer', '#F7E5DC'],
      ['error', '#C0392B'],
      ['errorContainer', '#F7E1DE'],
      ['background', '#FBF7EE'],
      ['surface', '#FFFFFF'],
      ['surfaceVariant', '#F4EDDD'],
      ['onSurface', '#1E1A14'],
      ['onSurfaceVariant', '#4A4439'],
      ['outline', '#CDBFA3'],
      ['outlineVariant', '#E0D7C5'],
      ['inverseSurface', '#1E1A14'],
      ['inverseOnSurface', '#FBF7EE'],
    ] as const)('%s resolves to %s', (role, value) => {
      expect((tokens.color.roles as Record<string, string>)[role]).toBe(value);
    });

    it('scrim is onSurface at 40% alpha', () => {
      expect(tokens.color.roles.scrim).toBe('rgba(30, 26, 20, 0.4)');
    });

    it('onTertiary/onError/onErrorContainer/onSecondaryContainer/onBackground are present strings', () => {
      expect(typeof tokens.color.roles.onTertiary).toBe('string');
      expect(typeof tokens.color.roles.onError).toBe('string');
      expect(typeof tokens.color.roles.onErrorContainer).toBe('string');
      expect(typeof tokens.color.roles.onSecondaryContainer).toBe('string');
      expect(typeof tokens.color.roles.onBackground).toBe('string');
    });
  });

  describe('typography — 12 flat roles', () => {
    it.each([
      ['headlineLarge', 26, 32, 700, 'Bricolage Grotesque'],
      ['headlineSmall', 21, 26, 600, 'Bricolage Grotesque'],
      ['titleLarge', 18, 24, 600, 'Hanken Grotesk'],
      ['titleMedium', 16, 22, 600, 'Hanken Grotesk'],
      ['titleSmall', 14, 20, 600, 'Hanken Grotesk'],
      ['bodyLarge', 16, 24, 400, 'Hanken Grotesk'],
      ['bodyMedium', 14, 20, 400, 'Hanken Grotesk'],
      ['bodySmall', 13, 18, 400, 'Hanken Grotesk'],
      ['labelLarge', 14, 20, 600, 'Hanken Grotesk'],
      ['labelMedium', 12, 16, 600, 'Hanken Grotesk'],
      ['labelSmall', 11, 14, 600, 'Hanken Grotesk'],
      ['mono', 14, 20, 500, 'Spline Mono'],
    ] as const)('%s is %d/%d/%d/%s', (role, fontSize, lineHeight, fontWeight, fontFamily) => {
      const r = (tokens.typography as Record<string, { fontSize: number; lineHeight: number; fontWeight: number; fontFamily: string }>)[role]!;
      expect(r.fontSize).toBe(fontSize);
      expect(r.lineHeight).toBe(lineHeight);
      expect(r.fontWeight).toBe(fontWeight);
      expect(r.fontFamily).toBe(fontFamily);
    });
  });

  describe('elevation — 6 levels, monotonically increasing', () => {
    it('has levels 0 through 5, each with ios/android/surfaceTint', () => {
      for (const level of [0, 1, 2, 3, 4, 5] as const) {
        const l = tokens.elevation[level];
        expect(l.ios).toBeDefined();
        expect(typeof l.android).toBe('number');
        expect(typeof l.surfaceTint).toBe('number');
      }
    });

    it('android elevation is monotonically non-decreasing across levels', () => {
      const values = [0, 1, 2, 3, 4, 5].map((l) => tokens.elevation[l as 0 | 1 | 2 | 3 | 4 | 5].android);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
      }
    });

    it('surfaceTint is monotonically non-decreasing across levels', () => {
      const values = [0, 1, 2, 3, 4, 5].map((l) => tokens.elevation[l as 0 | 1 | 2 | 3 | 4 | 5].surfaceTint);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
      }
    });

    it('level 0 is flat (no shadow, no elevation, no tint)', () => {
      expect(tokens.elevation[0].android).toBe(0);
      expect(tokens.elevation[0].surfaceTint).toBe(0);
      expect(tokens.elevation[0].ios.shadowOpacity).toBe(0);
    });
  });

  describe('disabled-state opacities', () => {
    it('content opacity is 38%', () => {
      expect(tokens.disabled.contentOpacity).toBe(0.38);
    });
    it('container opacity is 12%', () => {
      expect(tokens.disabled.containerOpacity).toBe(0.12);
    });
  });
});
