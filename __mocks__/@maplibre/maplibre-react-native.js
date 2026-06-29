// Manual mock for @maplibre/maplibre-react-native (optional peer dep)

const React = require('react');
const { View } = require('react-native');

const MapView = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.testID ?? 'maplibre-mapview',
    style: props.style,
    children: props.children,
  });
});

const Camera = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-camera',
    children: props.children,
  });
});

const MarkerView = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-marker',
    children: props.children,
  });
});

const RasterSource = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-raster-source',
    children: props.children,
  });
});

const RasterLayer = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: 'maplibre-raster-layer',
  });
});

const UserLocation = jest.fn().mockImplementation(() => {
  return React.createElement(View, { testID: 'maplibre-user-location' });
});

const LocationManager = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  getLastKnownLocation: jest.fn().mockResolvedValue(null),
};

module.exports = {
  MapView,
  Camera,
  MarkerView,
  RasterSource,
  RasterLayer,
  UserLocation,
  LocationManager,
};
