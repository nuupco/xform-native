/**
 * PR-1 tests: geopoint routing, registry gating, SatelliteTileCache stub (T-GEO04).
 */
import { pickWidget } from '../widgets/pickWidget';
import { GeoPointWidget } from '../widgets/GeoPointWidget';
import {
  preWarmSatelliteTiles,
  clearSatelliteTileCache,
  getCacheStatus,
} from '../widgets/offline/SatelliteTileCache';

describe('pickWidget — geopoint routing (T-GEO01)', () => {
  it('dispatches geopoint → GeoPointWidget', () => {
    const { Widget, variant } = pickWidget('geopoint', 'input', null);
    expect(Widget).toBe(GeoPointWidget);
    expect(variant).toBe('default');
  });
});

describe('isWidgetAvailable — geopoint gating (T-GEO02)', () => {
  it('geopoint returns false when optional dep is absent', () => {
    jest.isolateModules(() => {
      jest.doMock('@nuup/xform-native-geo', () => { throw new Error('not found'); });
      const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
      expect(() => localIsAvailable('geopoint')).not.toThrow();
      expect(localIsAvailable('geopoint')).toBe(false);
    });
  });

  it('geopoint returns true when @nuup/xform-native-geo is present', () => {
    jest.isolateModules(() => {
      jest.doMock('@nuup/xform-native-geo', () => ({}), { virtual: true });
      const { isWidgetAvailable: localIsAvailable } = require('../availability/registry');
      expect(localIsAvailable('geopoint')).toBe(true);
    });
  });
});

describe('SatelliteTileCache — stub API (T-GEO03)', () => {
  it('preWarmSatelliteTiles resolves without error', async () => {
    await expect(
      preWarmSatelliteTiles({ north: 1, south: 0, east: 1, west: 0 }, [10, 11]),
    ).resolves.toBeUndefined();
  });

  it('clearSatelliteTileCache resolves without error', async () => {
    await expect(clearSatelliteTileCache()).resolves.toBeUndefined();
  });

  it('getCacheStatus returns zero status when no cache backend', () => {
    const status = getCacheStatus();
    expect(status).toEqual({ tileCount: 0, sizeBytes: 0 });
  });
});
