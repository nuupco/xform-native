/**
 * T-10b: pickWidget dispatch (ADR-5).
 *
 * pickWidget(dataType, controlType, appearance) → { Widget, variant }
 * Covers PR-3a types only. PR-3b (select/range/date/time/dateTime) routes to
 * UnsupportedWidget with a clearly-marked TODO.
 */

import { pickWidget } from '../widgets/pickWidget';
import { StringWidget } from '../widgets/StringWidget';
import { IntWidget } from '../widgets/IntWidget';
import { DecimalWidget } from '../widgets/DecimalWidget';
import { LongWidget } from '../widgets/LongWidget';
import { BooleanWidget } from '../widgets/BooleanWidget';
import { NoteWidget } from '../widgets/NoteWidget';
import { UncastWidget } from '../widgets/UncastWidget';
describe('pickWidget — PR-3a types', () => {
  it('dispatches string → StringWidget default', () => {
    const { Widget, variant } = pickWidget('string', 'input', null);
    expect(Widget).toBe(StringWidget);
    expect(variant).toBe('default');
  });

  it('dispatches string multiline → StringWidget multiline', () => {
    const { Widget, variant } = pickWidget('string', 'input', 'multiline');
    expect(Widget).toBe(StringWidget);
    expect(variant).toBe('multiline');
  });

  it('dispatches int → IntWidget default', () => {
    const { Widget, variant } = pickWidget('int', 'input', null);
    expect(Widget).toBe(IntWidget);
    expect(variant).toBe('default');
  });

  it('dispatches decimal → DecimalWidget default', () => {
    const { Widget, variant } = pickWidget('decimal', 'input', null);
    expect(Widget).toBe(DecimalWidget);
    expect(variant).toBe('default');
  });

  it('dispatches long → LongWidget default', () => {
    const { Widget, variant } = pickWidget('long', 'input', null);
    expect(Widget).toBe(LongWidget);
    expect(variant).toBe('default');
  });

  it('dispatches boolean → BooleanWidget default', () => {
    const { Widget, variant } = pickWidget('boolean', 'input', null);
    expect(Widget).toBe(BooleanWidget);
    expect(variant).toBe('default');
  });

  it('dispatches boolean checkbox → BooleanWidget checkbox', () => {
    const { Widget, variant } = pickWidget('boolean', 'input', 'checkbox');
    expect(Widget).toBe(BooleanWidget);
    expect(variant).toBe('checkbox');
  });
});

describe('pickWidget — NoteWidget detection', () => {
  it('dispatches note appearance → NoteWidget', () => {
    const { Widget } = pickWidget('string', 'input', 'note');
    expect(Widget).toBe(NoteWidget);
  });
});

describe('pickWidget — uncast/unsupported/unknown → UncastWidget', () => {
  it('dispatches uncast → UncastWidget', () => {
    const { Widget } = pickWidget('uncast', 'input', null);
    expect(Widget).toBe(UncastWidget);
  });

  it('dispatches unsupported → UncastWidget', () => {
    const { Widget } = pickWidget('unsupported', 'input', null);
    expect(Widget).toBe(UncastWidget);
  });

  it('dispatches unknown dataType → UncastWidget', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { Widget } = pickWidget('geopoint' as any, 'input', null);
    expect(Widget).toBe(UncastWidget);
  });
});

// PR-3b dispatch — now tested in pickWidget-pr3b.test.ts
