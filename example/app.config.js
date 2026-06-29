module.exports = () => ({
  name: 'XFormNativeExample',
  slug: 'xform-native-example',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-secure-store',
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'org.nuup.xformnative.example',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
    package: 'org.nuup.xformnative.example',
  },
});
