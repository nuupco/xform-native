// Manual mock for react-native-webview (transitive optional dep of
// react-native-signature-canvas) — its own require() is only used as a
// presence check by SignatureWidget's feature gating.
module.exports = {
  WebView: () => null,
};
