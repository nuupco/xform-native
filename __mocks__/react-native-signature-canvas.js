// Manual mock for react-native-signature-canvas (optional peer dep, itself
// depending on react-native-webview — no real WebView renders under Jest).
const React = require('react');

const FAKE_SIGNATURE_DATA_URI = 'data:image/png;base64,__fake_signature__';

const SignatureCanvas = React.forwardRef(function SignatureCanvas(props, ref) {
  React.useImperativeHandle(ref, () => ({
    readSignature: jest.fn(() => {
      props.onOK?.(FAKE_SIGNATURE_DATA_URI);
    }),
    clearSignature: jest.fn(() => {
      props.onEmpty?.();
    }),
    changePenColor: jest.fn(),
    changePenSize: jest.fn(),
    draw: jest.fn(),
    erase: jest.fn(),
    getData: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    fromData: jest.fn(),
    setDataURL: jest.fn(),
    reinitialize: jest.fn(),
  }));

  return React.createElement(require('react-native').View, {
    testID: props.testID ?? 'signature-canvas-webview',
  });
});

module.exports = {
  __esModule: true,
  default: SignatureCanvas,
  __FAKE_SIGNATURE_DATA_URI: FAKE_SIGNATURE_DATA_URI,
};
