import { Platform } from 'react-native';
import { elevationStyle } from '../theme/elevationStyle';
import { mix } from '../theme/derive';
import { tokens } from '../tokens/tokens';

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os });
}

describe('elevationStyle', () => {
  afterEach(() => {
    setPlatform('ios');
  });

  it('iOS returns exactly the shadow keys for the level, no elevation key', () => {
    setPlatform('ios');
    const style = elevationStyle(tokens, 2) as Record<string, unknown>;
    expect(style.shadowColor).toBe(tokens.elevation[2].ios.shadowColor);
    expect(style.shadowOffset).toEqual(tokens.elevation[2].ios.shadowOffset);
    expect(style.shadowOpacity).toBe(tokens.elevation[2].ios.shadowOpacity);
    expect(style.shadowRadius).toBe(tokens.elevation[2].ios.shadowRadius);
    expect(style.elevation).toBeUndefined();
  });

  it('Android returns exactly the elevation number, no shadow* keys', () => {
    setPlatform('android');
    const style = elevationStyle(tokens, 3) as Record<string, unknown>;
    expect(style.elevation).toBe(tokens.elevation[3].android);
    expect(style.shadowColor).toBeUndefined();
    expect(style.shadowOffset).toBeUndefined();
    expect(style.shadowOpacity).toBeUndefined();
    expect(style.shadowRadius).toBeUndefined();
  });

  it("direction:'up' negates the iOS shadowOffset.height", () => {
    setPlatform('ios');
    const style = elevationStyle(tokens, 2, { direction: 'up' }) as Record<string, unknown>;
    const offset = style.shadowOffset as { width: number; height: number };
    expect(offset.height).toBe(-tokens.elevation[2].ios.shadowOffset.height);
    expect(offset.width).toBe(tokens.elevation[2].ios.shadowOffset.width);
  });

  it('level 0 background is a no-op tint (equals surface)', () => {
    setPlatform('ios');
    const style = elevationStyle(tokens, 0) as Record<string, unknown>;
    expect(style.backgroundColor).toBe(tokens.color.roles.surface);
  });

  it('tinted background equals mix(surface, primary, surfaceTint) for a non-zero level', () => {
    setPlatform('android');
    const style = elevationStyle(tokens, 3) as Record<string, unknown>;
    const expected = mix(
      tokens.color.roles.surface,
      tokens.color.roles.primary,
      tokens.elevation[3].surfaceTint,
    );
    expect(style.backgroundColor).toBe(expected);
  });
});
