const { defaults: jestExpoDefaults } = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  ...jestExpoDefaults,
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@nuup/xform-native$': '<rootDir>/src/index.tsx',
    '^react-native$': require.resolve('react-native'),
    '^react$': require.resolve('react'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
