/**
 * T-10a: appearance.ts — APPEARANCE_TABLE + resolveVariant (ADR-3).
 *
 * Resolution rule: lowercase+trim, split on whitespace, first recognized token wins.
 * Unknown or absent → that widget's 'default' variant. Never throws.
 */

import { resolveVariant } from '../widgets/appearance';

describe('resolveVariant — string', () => {
  it('returns default for absent appearance', () => {
    expect(resolveVariant('string', 'input', null)).toBe('default');
  });

  it('returns default for empty string', () => {
    expect(resolveVariant('string', 'input', '')).toBe('default');
  });

  it('returns multiline for appearance=multiline', () => {
    expect(resolveVariant('string', 'input', 'multiline')).toBe('multiline');
  });

  it('returns numbers for appearance=numbers', () => {
    expect(resolveVariant('string', 'input', 'numbers')).toBe('numbers');
  });

  it('returns url for appearance=url', () => {
    expect(resolveVariant('string', 'input', 'url')).toBe('url');
  });

  it('picks first recognized token from multi-token appearance', () => {
    expect(resolveVariant('string', 'input', 'multiline something-else')).toBe('multiline');
  });

  it('returns default for unknown appearance', () => {
    expect(resolveVariant('string', 'input', 'completely-unknown')).toBe('default');
  });

  it('is case-insensitive (trims and lowercases)', () => {
    expect(resolveVariant('string', 'input', '  MULTILINE  ')).toBe('multiline');
  });
});

describe('resolveVariant — int', () => {
  it('returns default for absent appearance', () => {
    expect(resolveVariant('int', 'input', null)).toBe('default');
  });

  it('returns thousands-sep for appearance=thousands-sep', () => {
    expect(resolveVariant('int', 'input', 'thousands-sep')).toBe('thousands-sep');
  });

  it('returns default for unknown appearance', () => {
    expect(resolveVariant('int', 'input', 'multiline')).toBe('default');
  });
});

describe('resolveVariant — decimal', () => {
  it('returns default by default', () => {
    expect(resolveVariant('decimal', 'input', null)).toBe('default');
  });

  it('returns thousands-sep', () => {
    expect(resolveVariant('decimal', 'input', 'thousands-sep')).toBe('thousands-sep');
  });
});

describe('resolveVariant — long', () => {
  it('returns default by default', () => {
    expect(resolveVariant('long', 'input', null)).toBe('default');
  });

  it('returns thousands-sep', () => {
    expect(resolveVariant('long', 'input', 'thousands-sep')).toBe('thousands-sep');
  });
});

describe('resolveVariant — boolean', () => {
  it('returns default (switch) for absent appearance', () => {
    expect(resolveVariant('boolean', 'input', null)).toBe('default');
  });

  it('returns checkbox for appearance=checkbox', () => {
    expect(resolveVariant('boolean', 'input', 'checkbox')).toBe('checkbox');
  });

  it('returns default for unknown appearance', () => {
    expect(resolveVariant('boolean', 'input', 'slider')).toBe('default');
  });
});

describe('resolveVariant — binary', () => {
  it('returns default for absent appearance', () => {
    expect(resolveVariant('binary', 'input', null)).toBe('default');
  });

  it('returns signature for appearance=draw', () => {
    expect(resolveVariant('binary', 'input', 'draw')).toBe('signature');
  });

  it('returns signature for appearance=signature', () => {
    expect(resolveVariant('binary', 'input', 'signature')).toBe('signature');
  });

  it('returns default for unknown appearance', () => {
    expect(resolveVariant('binary', 'input', 'completely-unknown')).toBe('default');
  });
});

describe('resolveVariant — selectOne minimal+autocomplete composition', () => {
  it('returns minimal-autocomplete when both tokens are present (minimal first)', () => {
    expect(resolveVariant('selectOne', 'select1', 'minimal autocomplete')).toBe(
      'minimal-autocomplete',
    );
  });

  it('returns minimal-autocomplete regardless of token order (autocomplete first)', () => {
    expect(resolveVariant('selectOne', 'select1', 'autocomplete minimal')).toBe(
      'minimal-autocomplete',
    );
  });

  it('still returns minimal when only minimal is present', () => {
    expect(resolveVariant('selectOne', 'select1', 'minimal')).toBe('minimal');
  });

  it('still returns autocomplete when only autocomplete is present', () => {
    expect(resolveVariant('selectOne', 'select1', 'autocomplete')).toBe('autocomplete');
  });

  it('still picks first recognized token for other combinations', () => {
    expect(resolveVariant('selectOne', 'select1', 'likert columns')).toBe('likert');
  });
});

describe('resolveVariant — selectMulti minimal+autocomplete composition', () => {
  it('returns minimal-autocomplete when both tokens are present', () => {
    expect(resolveVariant('selectMulti', 'select', 'minimal autocomplete')).toBe(
      'minimal-autocomplete',
    );
  });

  it('returns minimal-autocomplete regardless of token order', () => {
    expect(resolveVariant('selectMulti', 'select', 'autocomplete minimal')).toBe(
      'minimal-autocomplete',
    );
  });
});

describe('resolveVariant — unknown dataType (never throws)', () => {
  it('returns default for unknown dataType', () => {
    // TypeScript would complain about 'geopoint' here since it is not in the
    // table, but cast to any for the never-throw contract test.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(resolveVariant('geopoint' as any, 'input', 'something')).toBe('default');
  });
});
