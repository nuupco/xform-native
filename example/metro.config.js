const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro config for the example app.
 * Resolves `@nuup/xform-native` to the local package source (file:../ link)
 * so changes to the library are reflected immediately without a build step.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],
  resolver: {
    extraNodeModules: {
      '@nuup/xform-native': path.resolve(root, 'src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
