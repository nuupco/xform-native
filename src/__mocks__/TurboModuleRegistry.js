'use strict';

// Safe TurboModuleRegistry stub — returns minimal stubs for any native module
// that isn't available in the test environment (jest-expo + react-native 0.76).

const moduleStubs = {
  PlatformConstants: {
    getConstants: () => ({
      isTesting: true,
      reactNativeVersion: { major: 0, minor: 76, patch: 0 },
      osVersion: '17.0',
      systemName: 'iOS',
      interfaceIdiom: 'phone',
      forceTouchAvailable: false,
      isDisableAnimations: true,
    }),
  },
  SourceCode: {
    getConstants: () => ({ scriptURL: null }),
  },
};

const TurboModuleRegistry = {
  get: (name) => moduleStubs[name] ?? null,
  getEnforcing: (name) => {
    const mod = moduleStubs[name];
    if (mod) return mod;
    // Return a generic stub instead of throwing
    return { getConstants: () => ({}) };
  },
};

module.exports = TurboModuleRegistry;
module.exports.default = TurboModuleRegistry;
