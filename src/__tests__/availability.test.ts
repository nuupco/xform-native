import { isWidgetAvailable } from '../../src/index';
import type { DataType } from '@nuup/ts-rosa';

// The 12 P1 DataTypes that must return true
const P1_DATATYPES: DataType[] = [
  'string',
  'int',
  'decimal',
  'boolean',
  'date',
  'time',
  'dateTime',
  'selectOne',
  'selectMulti',
  'long',
  'uncast',
  'unsupported',
];

describe('isWidgetAvailable', () => {
  describe('P1 datatypes always return true', () => {
    it.each(P1_DATATYPES)('%s → true', (dataType) => {
      expect(isWidgetAvailable(dataType)).toBe(true);
    });
  });

  it('absent optional dep (geopoint) returns false without throwing', () => {
    // geopoint maps to a tryRequire guard; in test env the optional dep is absent
    expect(() => isWidgetAvailable('geopoint')).not.toThrow();
    expect(isWidgetAvailable('geopoint')).toBe(false);
  });

  it('calling with any input never throws', () => {
    const inputs: DataType[] = [
      ...P1_DATATYPES,
      'geopoint',
      'binary',
      'geoshape',
      'geotrace',
    ];
    for (const dt of inputs) {
      expect(() => isWidgetAvailable(dt)).not.toThrow();
    }
  });

  it('clean import of barrel throws nothing even with no optional deps', () => {
    // This is validated by the fact that this test file itself was imported
    // without error. We assert the function is callable as a proxy for that.
    expect(typeof isWidgetAvailable).toBe('function');
  });
});
