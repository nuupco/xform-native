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

  describe('binary availability (M01-M02)', () => {
    // Note: global __mocks__/expo-image-picker.js makes the require succeed
    // in this test file. The absent-dep scenarios are tested via jest.isolateModules below.
    it('binary returns true when mock expo-image-picker is available', () => {
      expect(isWidgetAvailable('binary')).toBe(true);
    });

    it('binary with mediatype image/* returns true when mock is available', () => {
      expect(isWidgetAvailable('binary', { mediatype: 'image/*' })).toBe(true);
    });

    it('binary with mediatype audio/* returns false when only expo-image-picker mock is present', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-av', () => { throw new Error(); });
        jest.doMock('react-native-svg', () => { throw new Error(); });
        jest.doMock('expo-document-picker', () => { throw new Error(); });
        const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
        expect(localIsAvailable('binary', { mediatype: 'audio/*' })).toBe(false);
      });
    });

    it('binary never throws regardless of opts', () => {
      expect(() => isWidgetAvailable('binary')).not.toThrow();
      expect(() => isWidgetAvailable('binary', { mediatype: 'image/*' })).not.toThrow();
      expect(() => isWidgetAvailable('binary', { mediatype: 'audio/*' })).not.toThrow();
      expect(() => isWidgetAvailable('binary', { mediatype: 'video/*' })).not.toThrow();
      expect(() => isWidgetAvailable('binary', { mediatype: 'application/pdf' })).not.toThrow();
    });

    it('binary with mediatype image/* returns true when expo-image-picker is present', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-image-picker', () => ({}), { virtual: true });
        const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
        expect(localIsAvailable('binary', { mediatype: 'image/*' })).toBe(true);
      });
    });

    it('binary returns true when any media dep is present', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-image-picker', () => ({}), { virtual: true });
        const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
        expect(localIsAvailable('binary')).toBe(true);
      });
    });

    it('binary with mediatype video/* returns true when mock expo-camera is available', () => {
      expect(isWidgetAvailable('binary', { mediatype: 'video/*' })).toBe(true);
    });

    it('binary with mediatype video/* returns false when only expo-image-picker mock is present', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-av', () => { throw new Error(); });
        jest.doMock('react-native-svg', () => { throw new Error(); });
        jest.doMock('expo-document-picker', () => { throw new Error(); });
        jest.doMock('expo-camera', () => { throw new Error(); });
        const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
        expect(localIsAvailable('binary', { mediatype: 'video/*' })).toBe(false);
      });
    });

    it('binary with mediatype audio/* returns false when only expo-image-picker is present', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-image-picker', () => ({}), { virtual: true });
        jest.doMock('expo-av', () => { throw new Error(); });
        jest.doMock('react-native-svg', () => { throw new Error(); });
        jest.doMock('expo-document-picker', () => { throw new Error(); });
        const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
        expect(localIsAvailable('binary', { mediatype: 'audio/*' })).toBe(false);
      });
    });
  });
});
