// Manual mock for react-native-svg (optional peer dep)
const React = require('react');
const { View } = require('react-native');

const Svg = ({ children, ...props }) =>
  React.createElement(View, { ...props, testID: 'svg-canvas' }, children);

const Path = (props) => React.createElement(View, { ...props, testID: 'svg-path' });

const G = ({ children, ...props }) =>
  React.createElement(View, { ...props }, children);

const Circle = (props) => React.createElement(View, { ...props, testID: 'svg-circle' });

const Rect = (props) => React.createElement(View, { ...props, testID: 'svg-rect' });

const Line = (props) => React.createElement(View, { ...props, testID: 'svg-line' });

const Polyline = (props) => React.createElement(View, { ...props, testID: 'svg-polyline' });

const Polygon = (props) => React.createElement(View, { ...props, testID: 'svg-polygon' });

const Text = ({ children, ...props }) =>
  React.createElement(View, { ...props }, children);

module.exports = {
  Svg,
  Path,
  G,
  Circle,
  Rect,
  Line,
  Polyline,
  Polygon,
  Text,
  default: Svg,
};
