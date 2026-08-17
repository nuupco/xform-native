// Manual mock for @nuup/xform-native-geo (optional peer dep bundle)
// Exposes MapLibre (v11+ API) + expo-location interfaces used by the geo widgets.

const maplibre = require('../@maplibre/maplibre-react-native');

const mockLocation = {
  coords: {
    latitude: 19.4326,
    longitude: -99.1332,
    altitude: 2240,
    accuracy: 5,
  },
};

let watchCallback = null;

const Location = {
  Accuracy: { BestForNavigation: 6 },
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue(mockLocation),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue(mockLocation),
  watchPositionAsync: jest.fn().mockImplementation((_options, callback) => {
    watchCallback = callback;
    callback(mockLocation);
    return Promise.resolve({ remove: jest.fn() });
  }),
  __triggerWatch: (loc) => {
    if (watchCallback) watchCallback(loc);
  },
};

const MapLibre = {
  Map: maplibre.Map,
  Camera: maplibre.Camera,
  Marker: maplibre.Marker,
  RasterSource: maplibre.RasterSource,
  GeoJSONSource: maplibre.GeoJSONSource,
  Layer: maplibre.Layer,
};

const SATELLITE_TILE_URI_TEMPLATE = 'file:///mock-documents/xform-satellite-tiles/{z}/{x}/{y}.png';
const MAX_CACHED_TILES = 4000;

module.exports = {
  MapLibre,
  Location,
  __mockLocation: mockLocation,
  SATELLITE_TILE_URI_TEMPLATE,
  MAX_CACHED_TILES,
  estimateSatelliteTileCount: jest.fn().mockReturnValue(0),
  preWarmSatelliteTiles: jest
    .fn()
    .mockResolvedValue({ downloaded: 0, skipped: 0, capReached: false }),
  clearSatelliteTileCache: jest.fn().mockResolvedValue(undefined),
};
