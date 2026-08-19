// Manual mock for expo-video (optional peer dep)

const React = require('react');
const { View } = require('react-native');

const mockPlayer = {
  playing: false,
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
};

const useVideoPlayer = jest.fn().mockImplementation(() => mockPlayer);

const VideoView = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.testID,
    style: props.style,
  });
});

module.exports = {
  useVideoPlayer,
  VideoView,
  __mockPlayer: mockPlayer,
};
