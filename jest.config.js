/** @type {import('jest').Config} */
module.exports = {
  // Using preset: 'react-native' (from @react-native/jest-preset) instead of jest-expo.
  // jest-expo was dropped because expo-modules-core TurboModuleRegistry.getEnforcing fails
  // at test startup when react-native is installed as a devDep (no native build). This library
  // has no Expo SDK dependency at runtime — expo deps would be transitive noise.
  // Aligned version set: react-native@0.79.7 + react@19.2.7 + @react-native/babel-preset@0.79.7
  //   + @react-native/jest-preset@0.85.3 + test-renderer@1.2.0 (RNTL v14 standalone renderer).
  preset: 'react-native',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: ['module:@react-native/babel-preset'],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@nuup/|test-renderer)/)',
  ],
  moduleNameMapper: {
    '^@nuup/xform-native$': '<rootDir>/src/index.tsx',
  },
};
