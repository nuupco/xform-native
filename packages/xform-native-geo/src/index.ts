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
  get: loadMapLibre,
  enumerable: true,
  configurable: true,
});

Object.defineProperty(module.exports, 'Location', {
  get: loadLocation,
  enumerable: true,
  configurable: true,
});
