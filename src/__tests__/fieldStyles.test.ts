import { tokens } from '../tokens/tokens';
import { createFieldStyles } from '../widgets/primitives/fieldStyles';

describe('createFieldStyles (pure)', () => {
  const f = createFieldStyles(tokens);

  it('returns every documented key', () => {
    expect(Object.keys(f).sort()).toEqual(
      [
        'field',
        'fieldAffordance',
        'fieldDisabled',
        'fieldError',
        'fieldFocused',
        'fieldNumeric',
        'fieldRow',
        'fieldText',
      ].sort()
    );
  });

  it('field: default resting state matches the M3 target values', () => {
    expect(f.field.borderWidth).toBe(1);
    expect(f.field.borderColor).toBe(tokens.color.roles.outline);
    expect(f.field.borderRadius).toBe(tokens.radius.md);
    expect(f.field.minHeight).toBeGreaterThanOrEqual(48);
    expect(f.field.backgroundColor).toBe(tokens.color.roles.surface);
    expect(f.field.paddingHorizontal).toBe(tokens.spacing.md);
    expect(f.field.paddingVertical).toBe(tokens.spacing.sm);
  });

  it('fieldText: bodyLarge typography over onSurface', () => {
    expect(f.fieldText.color).toBe(tokens.color.roles.onSurface);
    expect(f.fieldText.fontSize).toBe(tokens.typography.bodyLarge.fontSize);
  });

  it('fieldNumeric: mono typography over onSurface', () => {
    expect(f.fieldNumeric.color).toBe(tokens.color.roles.onSurface);
    expect(f.fieldNumeric.fontFamily).toBe(tokens.typography.mono.fontFamily);
  });

  it('fieldFocused: 2px primary underline (glove-target focus ring)', () => {
    expect(f.fieldFocused.borderWidth).toBe(2);
    expect(f.fieldFocused.borderColor).toBe(tokens.color.roles.primary);
  });

  it('fieldError: 2px error underline', () => {
    expect(f.fieldError.borderWidth).toBe(2);
    expect(f.fieldError.borderColor).toBe(tokens.color.roles.error);
  });

  it('fieldDisabled: surfaceVariant bg + onSurfaceVariant text + content opacity', () => {
    expect(f.fieldDisabled.backgroundColor).toBe(
      tokens.color.roles.surfaceVariant
    );
    expect(f.fieldDisabled.color).toBe(tokens.color.roles.onSurfaceVariant);
    expect(f.fieldDisabled.opacity).toBe(tokens.disabled.contentOpacity);
  });

  it('fieldRow: horizontal flex row with gap', () => {
    expect(f.fieldRow.flexDirection).toBe('row');
    expect(f.fieldRow.alignItems).toBe('center');
    expect(f.fieldRow.gap).toBe(tokens.spacing.sm);
  });

  it('fieldAffordance: 48dp square primaryContainer hit target', () => {
    expect(f.fieldAffordance.width).toBe(48);
    expect(f.fieldAffordance.height).toBe(48);
    expect(f.fieldAffordance.backgroundColor).toBe(
      tokens.color.roles.primaryContainer
    );
  });

  it('returns plain objects, not a StyleSheet.create() result (spreadable by consumers)', () => {
    // StyleSheet.create() output values are numeric IDs on some RN test envs;
    // here they must remain plain style objects so widgets can spread them.
    expect(typeof f.field).toBe('object');
    expect(f.field).not.toBeNull();
    expect(f.field.borderWidth).toBeDefined();
  });

  it('a different theme (overridden primary) changes fieldFocused.borderColor', () => {
    const overridden = createFieldStyles({
      ...tokens,
      color: {
        ...tokens.color,
        roles: { ...tokens.color.roles, primary: '#7B2CBF' },
      },
    } as unknown as typeof tokens);
    expect(overridden.fieldFocused.borderColor).toBe('#7B2CBF');
    expect(overridden.fieldFocused.borderColor).not.toBe(
      f.fieldFocused.borderColor
    );
  });
});
