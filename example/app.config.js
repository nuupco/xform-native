module.exports = () => ({
  name: 'XFormNativeExample',
  slug: 'xform-native-example',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-secure-store',
    'expo-font',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Esta app usa tu ubicación para capturar la geolocalización de las preguntas del formulario.',
      },
    ],
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
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
});
