/**
 * T3/T5: resolveWidget — wraps pickWidget, never replaces it (design D3).
 *
 * T3: with empty overrides, resolveWidget must be byte-identical to pickWidget
 * for every (dataType, controlType, appearance) case pickWidget handles.
 * T5: a registered override for an exact tuple is used only for that exact
 * tuple; a node with a different (unspecified) appearance still uses the
 * default chain (no swallow).
 */

import type { DataType, ControlType } from '@nuup/ts-rosa';
import { pickWidget } from '../widgets/pickWidget';
import { resolveWidget, type WidgetOverride } from '../widgets/registry';
import { RankWidget } from '../widgets/RankWidget';

const DATA_TYPES: readonly DataType[] = [
  'string',
  'int',
  'decimal',
  'boolean',
  'date',
  'time',
  'dateTime',
  'selectOne',
  'selectMulti',
  'geopoint',
  'binary',
  'long',
  'geoshape',
  'geotrace',
  'uncast',
  'unsupported',
];

const CONTROL_TYPES: readonly ControlType[] = [
  'input',
  'select1',
  'select',
  'rank',
  'trigger',
  'upload',
  'range',
  'secret',
  'unknown',
];

const APPEARANCES: readonly (string | null)[] = [
  null,
  'multiline',
  'minimal',
  'rank',
  'note',
  'draw',
];

describe('resolveWidget — no override registered (T3 regression sweep)', () => {
  for (const dataType of DATA_TYPES) {
    for (const controlType of CONTROL_TYPES) {
      for (const appearance of APPEARANCES) {
        it(`matches pickWidget for (${dataType}, ${controlType}, ${appearance})`, () => {
          const expected = pickWidget(dataType, controlType, appearance);
          const actual = resolveWidget({ dataType, controlType, appearance }, []);
          expect(actual).toEqual(expected);
        });
      }
    }
  }

  it('matches pickWidget for readonly + mediatype variants too', () => {
    const expected = pickWidget('binary', 'upload', null, false, 'image/*');
    const actual = resolveWidget(
      { dataType: 'binary', controlType: 'upload', appearance: null, readonly: false, mediatype: 'image/*' },
      []
    );
    expect(actual).toEqual(expected);
  });
});

describe('resolveWidget — override matching (T5)', () => {
  const override: WidgetOverride = {
    match: { controlType: 'select1', dataType: 'string', appearance: 'rank' },
    Widget: RankWidget,
  };

  it('uses the override for the exact registered tuple', () => {
    const result = resolveWidget(
      { dataType: 'string', controlType: 'select1', appearance: 'rank' },
      [override]
    );
    expect(result.Widget).toBe(RankWidget);
  });

  it('does not swallow a node with the same controlType/dataType but no appearance', () => {
    const expected = pickWidget('string', 'select1', null);
    const result = resolveWidget(
      { dataType: 'string', controlType: 'select1', appearance: null },
      [override]
    );
    expect(result).toEqual(expected);
    expect(result.Widget).not.toBe(RankWidget);
  });

  it('inherits the base variant when the override does not specify one', () => {
    const base = pickWidget('string', 'select1', 'rank');
    const result = resolveWidget(
      { dataType: 'string', controlType: 'select1', appearance: 'rank' },
      [override]
    );
    expect(result.variant).toBe(base.variant);
  });

  it('uses the override-specified variant when provided', () => {
    const result = resolveWidget(
      { dataType: 'string', controlType: 'select1', appearance: 'rank' },
      [{ ...override, variant: 'custom-variant' }]
    );
    expect(result.variant).toBe('custom-variant');
  });
});
