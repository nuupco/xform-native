'use strict';

const NativePlatformConstantsIOS = {
  getConstants: () => ({
    isTesting: true,
    reactNativeVersion: { major: 0, minor: 76, patch: 0 },
    osVersion: '17.0',
    systemName: 'iOS',
    interfaceIdiom: 'phone',
    forceTouchAvailable: false,
    isDisableAnimations: true,
  }),
};

module.exports = NativePlatformConstantsIOS;
module.exports.default = NativePlatformConstantsIOS;
