/** @type {import('jest').Config} */
module.exports = {
  // Minimal config for react-native + @testing-library/react-native v14
  // Using the bundled react-native jest preset (no expo)
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
