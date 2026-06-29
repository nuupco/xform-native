/**
 * @nuup/xform-native-geo — Geo peer dependency for @nuup/xform-native.
 *
 * Re-exports MapLibre and expo-location so xform-native geo widgets
 * (GeoPointWidget, GeoShapeWidget, GeoTraceWidget) can call:
 *
 *   const geo = require('@nuup/xform-native-geo');
 *   const { MapLibre } = geo;
 *   const location = await geo.Location.getCurrentPositionAsync();
 *
 * Install with:
 *   npm install @nuup/xform-native-geo
 *
 * This automatically pulls in peer deps:
 *   @maplibre/maplibre-react-native
 *   expo-location
 */

// Re-export MapLibre GL components used by geo widgets
export {
  default as MapLibre,
  MapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
  CircleLayer,
  type MapViewProps,
  type CameraProps,
  type PointAnnotationProps,
  type ShapeSourceProps,
  type FillLayerProps,
  type LineLayerProps,
  type CircleLayerProps,
} from '@maplibre/maplibre-react-native';

// Re-export expo-location
export * as Location from 'expo-location';
