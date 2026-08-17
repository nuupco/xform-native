// Manual mock for @maplibre/maplibre-react-native (v11+ API, optional peer dep)

const React = require('react');
const { View } = require('react-native');

const Map = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.testID ?? 'maplibre-map',
    style: props.style,
    onPress: () => {
      if (props.onPress) {
        props.onPress({ nativeEvent: { lngLat: [-99.2, 19.5] } });
      }
    },
    children: props.children,
  });
});

const Camera = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    flyTo: jest.fn(),
  }));
  return React.createElement(View, {
    testID: 'maplibre-camera',
    children: props.children,
  });
});

const Marker = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.id ? `maplibre-marker-${props.id}` : 'maplibre-marker',
    children: props.children,
  });
});

const RasterSource = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.id ? `maplibre-raster-source-${props.id}` : 'maplibre-raster-source',
    children: props.children,
  });
});

const GeoJSONSource = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.id ? `maplibre-geojson-source-${props.id}` : 'maplibre-geojson-source',
    children: props.children,
  });
});

const Layer = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.id ? `maplibre-layer-${props.id}` : 'maplibre-layer',
  });
});

module.exports = {
  Map,
  Camera,
  Marker,
  RasterSource,
  GeoJSONSource,
  Layer,
};
