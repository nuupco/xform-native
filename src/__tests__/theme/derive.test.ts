import { mix, luminance, onColor, deriveRoleSet } from '../../theme/derive';

describe('mix — per-channel sRGB lerp', () => {
  it('mixes black and white at 50% to mid gray', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });
  it('t=0 returns the first color', () => {
    expect(mix('#265A36', '#FFFFFF', 0)).toBe('#265A36');
  });
  it('t=1 returns the second color', () => {
    expect(mix('#265A36', '#FFFFFF', 1)).toBe('#FFFFFF');
  });
});

describe('luminance — WCAG relative luminance', () => {
  it('black is 0', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 5);
  });
  it('white is 1', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5);
  });
  it('Campo primary (dark green) is below 0.5', () => {
    expect(luminance('#265A36')).toBeLessThan(0.5);
  });
  it('Campo secondary (gold) is above 0.5', () => {
    expect(luminance('#EFBE4E')).toBeGreaterThan(0.5);
  });
});

describe('onColor — ink color for a base', () => {
  it('picks white ink on a dark base', () => {
    expect(onColor('#265A36')).toBe('#FFFFFF');
  });
  it('picks dark ink on a light base', () => {
    expect(onColor('#EFBE4E')).toBe('#1A1C18');
  });
});

describe('deriveRoleSet — {base,on,container,onContainer} quartet', () => {
  it('derives from an arbitrary override hex', () => {
    const result = deriveRoleSet('#7B2CBF');
    expect(result.base).toBe('#7B2CBF');
    expect(result.on).toBe(onColor('#7B2CBF'));
    expect(result.container).toBe(mix('#7B2CBF', '#FFFFFF', 0.86));
    expect(result.onContainer).toBe(mix('#7B2CBF', '#000000', 0.68));
  });
});
