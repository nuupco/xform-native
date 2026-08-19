// Manual mock for expo-camera (optional peer dep)

const React = require('react');
const { View } = require('react-native');

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

let barcodeCallback = null;

const CameraView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    recordAsync: mockRecordAsync,
    stopRecording: mockStopRecording,
  }));

  // Capture barcode scanner callback for test triggering
  if (props.onBarcodeScanned) {
    barcodeCallback = props.onBarcodeScanned;
  }

  return React.createElement(View, {
    testID: props.testID ?? 'camera-view',
    style: props.style,
  });
});

const grantedPermission = {
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
};

const useCameraPermissions = jest.fn().mockReturnValue([
  grantedPermission,
  jest.fn().mockResolvedValue(grantedPermission),
]);

const getCameraPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const requestCameraPermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const getMicrophonePermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);
const requestMicrophonePermissionsAsync = jest.fn().mockResolvedValue(grantedPermission);

module.exports = {
  CameraView,
  useCameraPermissions,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
  __mockRecordAsync: mockRecordAsync,
  __mockStopRecording: mockStopRecording,
  __triggerBarcode: (data) => {
    if (barcodeCallback) {
      barcodeCallback({ data });
    }
  },
};
