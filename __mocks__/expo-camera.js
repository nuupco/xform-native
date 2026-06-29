// Manual mock for expo-camera (optional peer dep)

const React = require('react');

let resolveRecord = null;

const mockRecordAsync = jest.fn().mockImplementation(() => {
  return new Promise((resolve) => {
    resolveRecord = resolve;
  });
});

const mockStopRecording = jest.fn().mockImplementation(() => {
  if (resolveRecord) {
    resolveRecord({ uri: 'file://video.mp4' });
    resolveRecord = null;
  }
});

const CameraView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    recordAsync: mockRecordAsync,
    stopRecording: mockStopRecording,
  }));
  return null;
});

const useCameraPermissions = jest.fn().mockReturnValue([
  { granted: true },
  jest.fn().mockResolvedValue({ granted: true }),
]);

module.exports = {
  CameraView,
  useCameraPermissions,
  __mockRecordAsync: mockRecordAsync,
  __mockStopRecording: mockStopRecording,
};
