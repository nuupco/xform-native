'use strict';

// Minimal expo-modules-core stub for testing
module.exports = {
  NativeModulesProxy: {},
  Platform: { OS: 'ios', Version: '17.0', select: (obj) => obj.ios ?? obj.default ?? obj.native },
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => null,
  EventEmitter: class EventEmitter {
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
  },
};
