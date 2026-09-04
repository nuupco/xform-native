/**
 * T-10a: appearance.ts — APPEARANCE_TABLE + resolveVariant (ADR-3).
 *
 * Resolution rule: lowercase+trim, split on whitespace, first recognized token wins.
 * Unknown or absent → that widget's 'default' variant. Never throws.
 */

import { resolveVariant } from '../../../widgets/engine/appearance';

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

describe('resolveVariant — selectOne minimal/autocomplete tokens (no compound variant)', () => {
  // ODK evaluates 'minimal' and 'autocomplete' independently; this table has
  // no compound variant, so it resolves by first-recognized-token.
  it('resolves to minimal when minimal is the first recognized token', () => {
    expect(resolveVariant('selectOne', 'select1', 'minimal autocomplete')).toBe('minimal');
  });

  it('resolves to autocomplete when autocomplete is the first recognized token', () => {
    expect(resolveVariant('selectOne', 'select1', 'autocomplete minimal')).toBe('autocomplete');
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

  it('treats "search" as a synonym for "autocomplete" (bare token)', () => {
    expect(resolveVariant('selectOne', 'select1', 'search')).toBe('autocomplete');
  });

  it('resolves "minimal and search" to minimal (production XLSForm convention, "and" ignored as unrecognized filler)', () => {
    expect(resolveVariant('selectOne', 'select1', 'minimal and search')).toBe('minimal');
  });
});

describe('resolveVariant — selectMulti minimal/autocomplete tokens (no compound variant)', () => {
  it('resolves to minimal when minimal is the first recognized token', () => {
    expect(resolveVariant('selectMulti', 'select', 'minimal autocomplete')).toBe('minimal');
  });

  it('resolves to autocomplete when autocomplete is the first recognized token', () => {
    expect(resolveVariant('selectMulti', 'select', 'autocomplete minimal')).toBe('autocomplete');
  });
});

describe('resolveVariant — unknown dataType (never throws)', () => {
  it('returns default for unknown dataType', () => {
    // TypeScript would complain about a made-up dataType here since it's not
    // in the table, but cast to any for the never-throw contract test.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(resolveVariant('not-a-real-datatype' as any, 'input', 'something')).toBe('default');
  });
});

describe('resolveVariant — selectOne compact / no-buttons', () => {
  it('returns compact for appearance=compact', () => {
    expect(resolveVariant('selectOne', 'select1', 'compact')).toBe('compact');
  });

  it('returns no-buttons for appearance=no-buttons', () => {
    expect(resolveVariant('selectOne', 'select1', 'no-buttons')).toBe('no-buttons');
  });

  it('returns image-map for appearance=image-map', () => {
    expect(resolveVariant('selectOne', 'select1', 'image-map')).toBe('image-map');
  });
});

describe('resolveVariant — selectMulti compact', () => {
  it('returns compact for appearance=compact', () => {
    expect(resolveVariant('selectMulti', 'select', 'compact')).toBe('compact');
  });
});

describe('resolveVariant — selectOne list / list-nolabel / label', () => {
  it('returns list for appearance=list', () => {
    expect(resolveVariant('selectOne', 'select1', 'list')).toBe('list');
  });

  it('returns list-nolabel for appearance=list-nolabel', () => {
    expect(resolveVariant('selectOne', 'select1', 'list-nolabel')).toBe('list-nolabel');
  });

  it('returns label for appearance=label', () => {
    expect(resolveVariant('selectOne', 'select1', 'label')).toBe('label');
  });
});

describe('resolveVariant — selectMulti list-nolabel', () => {
  it('returns list-nolabel for appearance=list-nolabel', () => {
    expect(resolveVariant('selectMulti', 'select', 'list-nolabel')).toBe('list-nolabel');
  });
});

describe('resolveVariant — columns-n (parametrized)', () => {
  it('resolves selectOne columns-3 to columns-n', () => {
    expect(resolveVariant('selectOne', 'select1', 'columns-3')).toBe('columns-n');
  });

  it('resolves selectOne columns-12 to columns-n', () => {
    expect(resolveVariant('selectOne', 'select1', 'columns-12')).toBe('columns-n');
  });

  it('resolves selectMulti columns-3 to columns-n', () => {
    expect(resolveVariant('selectMulti', 'select', 'columns-3')).toBe('columns-n');
  });

  it('does not treat plain "columns" as columns-n', () => {
    expect(resolveVariant('selectOne', 'select1', 'columns')).toBe('columns');
  });
});

describe('resolveVariant — geopoint', () => {
  it('returns default for absent appearance', () => {
    expect(resolveVariant('geopoint', 'input', null)).toBe('default');
  });

  it('returns placement-map for appearance=placement-map', () => {
    expect(resolveVariant('geopoint', 'input', 'placement-map')).toBe('placement-map');
  });
});

describe('resolveVariant — int range rating / bearing', () => {
  it('returns rating for controlType:range appearance=rating', () => {
    expect(resolveVariant('int', 'range', 'rating')).toBe('rating');
  });

  it('returns bearing for int input appearance=bearing', () => {
    expect(resolveVariant('int', 'input', 'bearing')).toBe('bearing');
  });

  it('returns counter for int input appearance=counter', () => {
    expect(resolveVariant('int', 'input', 'counter')).toBe('counter');
  });
});

describe('resolveVariant — string masked', () => {
  it('returns masked for string input appearance=masked', () => {
    expect(resolveVariant('string', 'input', 'masked')).toBe('masked');
  });

  it('numbers wins over masked regardless of token order', () => {
    expect(resolveVariant('string', 'input', 'masked numbers')).toBe('numbers');
    expect(resolveVariant('string', 'input', 'numbers masked')).toBe('numbers');
  });
});

describe('resolveVariant — date no-calendar', () => {
  it('returns no-calendar for appearance=no-calendar', () => {
    expect(resolveVariant('date', 'input', 'no-calendar')).toBe('no-calendar');
  });
});

describe('resolveVariant — binary upload appearance tokens', () => {
  it('returns annotate for appearance=annotate', () => {
    expect(resolveVariant('binary', 'upload', 'annotate')).toBe('annotate');
  });

  it('returns selfie for appearance=selfie', () => {
    expect(resolveVariant('binary', 'upload', 'selfie')).toBe('selfie');
  });

  it('returns front-camera for appearance=front-camera', () => {
    expect(resolveVariant('binary', 'upload', 'front-camera')).toBe('front-camera');
  });

  it('returns new-front for appearance=new-front', () => {
    expect(resolveVariant('binary', 'upload', 'new-front')).toBe('new-front');
  });

  it('returns new for appearance=new', () => {
    expect(resolveVariant('binary', 'upload', 'new')).toBe('new');
  });
});
