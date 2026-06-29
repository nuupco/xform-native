// Manual mock for @nuup/xform-native-geo (optional peer dep bundle)
// Exposes MapLibre + expo-location interfaces used by GeoPointWidget.

const React = require('react');
const { View, Text } = require('react-native');

// Mock MapLibre MapView
const MapView = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.testID ?? 'maplibre-mapview',
    style: props.style,
    onPress: () => {
      if (props.onPress) {
        props.onPress({
          geometry: { coordinates: [-99.2000, 19.5000] },
        });
      }
    },
    children: props.children,
  });
});

// Mock Camera
const Camera = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-camera',
    children: props.children,
  });
});

// Mock MarkerView
const MarkerView = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-marker',
    children: props.children,
  });
});

// Mock RasterSource
const RasterSource = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-raster-source',
    children: props.children,
  });
});

// Mock RasterLayer
const RasterLayer = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-raster-layer',
  });
});

// Mock UserLocation
const UserLocation = jest.fn().mockImplementation(() => {
  return React.createElement(View, { testID: 'maplibre-user-location' });
});

// Mock LocationManager
const LocationManager = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  getLastKnownLocation: jest.fn().mockResolvedValue(null),
};

// Mock MapLibre module
const MapLibre = {
  MapView,
  Camera,
  MarkerView,
  RasterSource,
  RasterLayer,
  UserLocation,
  LocationManager,
};

// Mock expo-location
const mockLocation = {
  coords: {
    latitude: 19.4326,
    longitude: -99.1332,
    altitude: 2240,
    accuracy: 5,
  },
};

const Location = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue(mockLocation),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
};

module.exports = {
  MapLibre,
  Location,
  __mockLocation: mockLocation,
};
