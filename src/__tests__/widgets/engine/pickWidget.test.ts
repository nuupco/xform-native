/**
 * T-10b: pickWidget dispatch (ADR-5).
 *
 * pickWidget(dataType, controlType, appearance) → { Widget, variant }
 * Covers PR-3a types only. PR-3b (select/range/date/time/dateTime) routes to
 * UnsupportedWidget with a clearly-marked TODO.
 */

import { pickWidget } from '../../../widgets/engine/pickWidget';
import { TriggerWidget } from '../../../widgets/TriggerWidget';
import { StringWidget } from '../../../widgets/StringWidget';
import { IntWidget } from '../../../widgets/IntWidget';
import { DecimalWidget } from '../../../widgets/DecimalWidget';
import { LongWidget } from '../../../widgets/LongWidget';
import { BooleanWidget } from '../../../widgets/BooleanWidget';
import { NoteWidget } from '../../../widgets/NoteWidget';
import { UncastWidget } from '../../../widgets/UncastWidget';
import { ImageWidget } from '../../../widgets/ImageWidget';
import { AudioWidget } from '../../../widgets/AudioWidget';
import { VideoWidget } from '../../../widgets/VideoWidget';
import { SignatureWidget } from '../../../widgets/SignatureWidget';
import { FileWidget } from '../../../widgets/FileWidget';
import { GeoShapeWidget } from '../../../widgets/GeoShapeWidget';
import { GeoTraceWidget } from '../../../widgets/GeoTraceWidget';
import { BarcodeWidget } from '../../../widgets/BarcodeWidget';

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

describe('pickWidget — trigger controlType routing', () => {
  it('dispatches string + controlType trigger → TriggerWidget, not StringWidget', () => {
    const { Widget, variant } = pickWidget('string', 'trigger', null);
    expect(Widget).toBe(TriggerWidget);
    expect(Widget).not.toBe(StringWidget);
    expect(variant).toBe('default');
  });
});

describe('pickWidget — NoteWidget detection', () => {
  it('dispatches note appearance → NoteWidget', () => {
    const { Widget } = pickWidget('string', 'input', 'note');
    expect(Widget).toBe(NoteWidget);
  });

  it('dispatches readonly string input → NoteWidget', () => {
    const { Widget } = pickWidget('string', 'input', null, true);
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
    const { Widget } = pickWidget('unknownType' as any, 'input', null);
    expect(Widget).toBe(UncastWidget);
  });
});

// PR-3b dispatch — now tested in pickWidget-pr3b.test.ts

describe('pickWidget — binary routing (M17-M19)', () => {
  it('dispatches binary + draw appearance → SignatureWidget', () => {
    const { Widget } = pickWidget('binary', 'input', 'draw', false, null);
    expect(Widget).toBe(SignatureWidget);
  });

  it('dispatches binary + signature appearance → SignatureWidget', () => {
    const { Widget } = pickWidget('binary', 'input', 'signature', false, null);
    expect(Widget).toBe(SignatureWidget);
  });

  it('dispatches binary + mediatype image/* → ImageWidget', () => {
    const { Widget } = pickWidget('binary', 'input', null, false, 'image/*');
    expect(Widget).toBe(ImageWidget);
  });

  it('dispatches binary + mediatype audio/* → AudioWidget', () => {
    const { Widget } = pickWidget('binary', 'input', null, false, 'audio/*');
    expect(Widget).toBe(AudioWidget);
  });

  it('dispatches binary + mediatype video/* → VideoWidget', () => {
    const { Widget } = pickWidget('binary', 'input', null, false, 'video/*');
    expect(Widget).toBe(VideoWidget);
  });

  it('dispatches binary + unknown mediatype → FileWidget', () => {
    const { Widget } = pickWidget('binary', 'input', null, false, 'application/pdf');
    expect(Widget).toBe(FileWidget);
  });

  it('dispatches binary + no mediatype → FileWidget', () => {
    const { Widget } = pickWidget('binary', 'input', null, false, null);
    expect(Widget).toBe(FileWidget);
  });

  it('appearance draw wins over mediatype image/*', () => {
    const { Widget } = pickWidget('binary', 'input', 'draw', false, 'image/*');
    expect(Widget).toBe(SignatureWidget);
  });

  it('appearance signature wins over mediatype audio/*', () => {
    const { Widget } = pickWidget('binary', 'input', 'signature', false, 'audio/*');
    expect(Widget).toBe(SignatureWidget);
  });
});

describe('pickWidget — P5 geo + barcode routing', () => {
  it('dispatches geoshape → GeoShapeWidget', () => {
    const { Widget, variant } = pickWidget('geoshape', 'input', null);
    expect(Widget).toBe(GeoShapeWidget);
    expect(variant).toBe('default');
  });

  it('dispatches geotrace → GeoTraceWidget', () => {
    const { Widget, variant } = pickWidget('geotrace', 'input', null);
    expect(Widget).toBe(GeoTraceWidget);
    expect(variant).toBe('default');
  });

  it('dispatches binary + barcode appearance → BarcodeWidget', () => {
    const { Widget, variant } = pickWidget('binary', 'input', 'barcode', false, null);
    expect(Widget).toBe(BarcodeWidget);
    expect(variant).toBe('default');
  });
});
