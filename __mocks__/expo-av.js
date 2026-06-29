// Manual mock for expo-av (optional peer dep)

const mockRecording = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  startAsync: jest.fn().mockResolvedValue(undefined),
  stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
  getURI: jest.fn().mockReturnValue('file://recording.m4a'),
};

const mockSound = {
  playAsync: jest.fn().mockResolvedValue(undefined),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
};

const Recording = jest.fn().mockImplementation(() => mockRecording);

const Sound = {
  createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
};

const RecordingOptionsPresets = {
  HIGH_QUALITY: {},
};

const React = require('react');
const { View } = require('react-native');

const Video = jest.fn().mockImplementation((props) => {
  return React.createElement(View, {
    testID: props.testID,
    style: props.style,
  });
});

const Audio = {
  Recording,
  Sound,
  RecordingOptionsPresets,
};

module.exports = {
  Audio,
  Video,
  __mockRecording: mockRecording,
  __mockSound: mockSound,
};
