/**
 * @nuup/xform-native-geo — Geo peer dependency for @nuup/xform-native.
 *
 * Lazy-loads MapLibre and expo-location. Widgets destructure normally:
 *   const geo = require('@nuup/xform-native-geo');
 *   const { MapLibre } = geo;
 */

let _maplibre: any = undefined;
let _location: any = undefined;

function loadMapLibre(): any {
  if (_maplibre === undefined) {
    try {
      _maplibre = require('@maplibre/maplibre-react-native');
    } catch {
      _maplibre = null;
    }
  }
  if (!_maplibre) throw new Error('@maplibre/maplibre-react-native not installed');
  return _maplibre;
}

function loadLocation(): any {
  if (_location === undefined) {
    try {
      _location = require('expo-location');
    } catch {
      _location = null;
    }
  }
  if (!_location) throw new Error('expo-location not installed');
  return _location;
}

Object.defineProperty(module.exports, 'MapLibre', {
  get() {
    const maplibre = loadMapLibre();
    return {
      Map: maplibre.Map,
      Camera: maplibre.Camera,
      Marker: maplibre.Marker,
      RasterSource: maplibre.RasterSource,
      GeoJSONSource: maplibre.GeoJSONSource,
      Layer: maplibre.Layer,
    };
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'Location', {
  get: loadLocation,
  enumerable: true,
  configurable: true,
});

// Tile-cache API is lazily re-exported too: it requires `expo-file-system/legacy`,
// another optional peer dep, and must not be evaluated until actually used.
let _tileCache: any = undefined;

function loadTileCache(): any {
  if (_tileCache === undefined) {
    try {
      _tileCache = require('./SatelliteTileCache');
    } catch {
      _tileCache = null;
    }
  }
  if (!_tileCache) throw new Error('expo-file-system not installed');
  return _tileCache;
}

Object.defineProperty(module.exports, 'SATELLITE_TILE_URI_TEMPLATE', {
  get() {
    return loadTileCache().SATELLITE_TILE_URI_TEMPLATE;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'MAX_CACHED_TILES', {
  get() {
    return loadTileCache().MAX_CACHED_TILES;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'estimateSatelliteTileCount', {
  get() {
    return loadTileCache().estimateSatelliteTileCount;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'preWarmSatelliteTiles', {
  get() {
    return loadTileCache().preWarmSatelliteTiles;
  },
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'clearSatelliteTileCache', {
  get() {
    return loadTileCache().clearSatelliteTileCache;
  },
  enumerable: true,
  configurable: true,
});
