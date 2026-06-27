'use strict';

// Polyfill TurboModuleRegistry.getEnforcing to return safe stubs for any
// native module that isn't available in the test environment.
// This prevents "could not be found" invariant violations when expo-modules
// eagerly load platform constants.

const { TurboModuleRegistry } = require('react-native');
const orig = TurboModuleRegistry.getEnforcing;

TurboModuleRegistry.getEnforcing = function safeGetEnforcing(name) {
  try {
    return orig.call(TurboModuleRegistry, name);
  } catch (_err) {
    // Return a minimal stub so callers that call getConstants() don't throw
    return {
      getConstants: () => ({}),
    };
  }
};
