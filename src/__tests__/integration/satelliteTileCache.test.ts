/**
 * SatelliteTileCache tests — offline satellite tile pre-warming (PR1 of
 * geo-widget-field-parity, Track B).
 *
 * jest `testMatch` is restricted to `src/__tests__/**` (see jest.config.js),
 * so this test lives here and imports the module under test via a relative
 * path, deliberately bypassing the `__mocks__/@nuup/xform-native-geo.js`
 * manual mock seam. `expo-file-system/legacy` itself is mocked below since
 * it is not installed as a real dependency in this workspace (optional peer
 * dep of the geo package, lazily required).
 */

const mockFs = {
  documentDirectory: 'file:///mock-documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock('expo-file-system/legacy', () => mockFs, { virtual: true });

// Plain `require` (not a static ES `import`) is deliberate: ES imports are
// hoisted above ALL other top-level statements (including the `const mockFs`
// this jest.mock factory closes over), so the module under test would import
// `expo-file-system/legacy` before `mockFs` is even assigned.
const {
  estimateSatelliteTileCount,
  preWarmSatelliteTiles,
  clearSatelliteTileCache,
  MAX_CACHED_TILES,
  SATELLITE_TILE_URI_TEMPLATE,
} = require('../../../packages/xform-native-geo/src/SatelliteTileCache');

const BBOX: [number, number, number, number] = [-99.14, 19.42, -99.12, 19.44];

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.getInfoAsync.mockResolvedValue({ exists: false });
  mockFs.makeDirectoryAsync.mockResolvedValue(undefined);
  mockFs.downloadAsync.mockResolvedValue(undefined);
  mockFs.deleteAsync.mockResolvedValue(undefined);
});

describe('SatelliteTileCache', () => {
  it('uses expo-file-system/legacy documentDirectory (not cacheDirectory) for the URI template', () => {
    expect(SATELLITE_TILE_URI_TEMPLATE.startsWith(mockFs.documentDirectory)).toBe(true);
  });

  it('estimates a positive tile count for a bbox/zoom range', () => {
    const count = estimateSatelliteTileCount(BBOX, 12, 17);
    expect(count).toBeGreaterThan(0);
  });

  it('estimates zero additional tiles for an inverted/degenerate bbox at a single zoom', () => {
    const count = estimateSatelliteTileCount([0, 0, 0, 0], 12, 12);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('skips downloading tiles that already exist locally', async () => {
    mockFs.getInfoAsync.mockResolvedValue({ exists: true });

    await preWarmSatelliteTiles(BBOX, 12, 12);

    expect(mockFs.downloadAsync).not.toHaveBeenCalled();
  });

  it('tolerates individual tile download failures (e.g. 404) and continues', async () => {
    mockFs.downloadAsync
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValue(undefined);

    const result = await preWarmSatelliteTiles(BBOX, 12, 12);

    expect(mockFs.downloadAsync).toHaveBeenCalled();
    expect(result.capReached).toBe(false);
  });

  it('stops and reports capReached once MAX_CACHED_TILES would be exceeded', async () => {
    // Wide bbox across many zoom levels guarantees far more than MAX_CACHED_TILES tiles.
    const wideBbox: [number, number, number, number] = [-179, -85, 179, 85];

    const result = await preWarmSatelliteTiles(wideBbox, 0, 17);

    expect(result.capReached).toBe(true);
    expect(mockFs.downloadAsync.mock.calls.length).toBeLessThanOrEqual(MAX_CACHED_TILES);
  });

  it('constructs ESRI z/y/x tile URLs (row before column)', async () => {
    await preWarmSatelliteTiles(BBOX, 12, 12);

    const [url] = mockFs.downloadAsync.mock.calls[0];
    expect(url).toMatch(
      /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/12\/\d+\/\d+$/,
    );
  });

  it('removes the cache root directory on clear', async () => {
    mockFs.getInfoAsync.mockResolvedValue({ exists: true });

    await clearSatelliteTileCache();

    expect(mockFs.deleteAsync).toHaveBeenCalledWith(
      expect.stringContaining(mockFs.documentDirectory),
      expect.objectContaining({ idempotent: true }),
    );
  });

  it('is a no-op on clear when no cache exists', async () => {
    mockFs.getInfoAsync.mockResolvedValue({ exists: false });

    await clearSatelliteTileCache();

    expect(mockFs.deleteAsync).not.toHaveBeenCalled();
  });
});
