import { tokens } from '../../src/index';

describe('tokens', () => {
  it('is a plain object (no function call needed)', () => {
    expect(typeof tokens).toBe('object');
    expect(tokens).not.toBeNull();
  });

  describe('color', () => {
    it('primary is a non-empty string', () => {
      expect(typeof tokens.color.primary).toBe('string');
      expect(tokens.color.primary.length).toBeGreaterThan(0);
    });
    it('background is a non-empty string', () => {
      expect(typeof tokens.color.background).toBe('string');
      expect(tokens.color.background.length).toBeGreaterThan(0);
    });
    it('surface is a non-empty string', () => {
      expect(typeof tokens.color.surface).toBe('string');
      expect(tokens.color.surface.length).toBeGreaterThan(0);
    });
    it('error is a non-empty string', () => {
      expect(typeof tokens.color.error).toBe('string');
      expect(tokens.color.error.length).toBeGreaterThan(0);
    });
    it('text is a non-empty string', () => {
      expect(typeof tokens.color.text).toBe('string');
      expect(tokens.color.text.length).toBeGreaterThan(0);
    });
  });

  describe('spacing', () => {
    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
      '%s is a positive number',
      (key) => {
        expect(typeof tokens.spacing[key]).toBe('number');
        expect(tokens.spacing[key]).toBeGreaterThan(0);
      }
    );
  });

  describe('radius', () => {
    it.each(['sm', 'md', 'lg'] as const)(
      '%s is a non-negative number',
      (key) => {
        expect(typeof tokens.radius[key]).toBe('number');
        expect(tokens.radius[key]).toBeGreaterThanOrEqual(0);
      }
    );
  });

  describe('font', () => {
    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
      '%s is a positive number',
      (key) => {
        expect(typeof tokens.font[key]).toBe('number');
        expect(tokens.font[key]).toBeGreaterThan(0);
      }
    );
  });
});
