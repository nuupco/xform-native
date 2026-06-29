const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Block parent node_modules to avoid duplicate React/RN
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(path.resolve(workspaceRoot, 'node_modules', 'react').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(workspaceRoot, 'node_modules', 'react-native').replace(/\\/g, '\\\\')),
];

// Resolve from example and parent node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Map library imports to source for live reload
config.resolver.extraNodeModules = {
  '@nuup/xform-native': path.resolve(workspaceRoot),
  '@nuup/ts-rosa': path.resolve(workspaceRoot, '..', 'ts-rosa'),
};

// Watch parent for changes (xform-native source + packages)
config.watchFolders = [
  path.resolve(workspaceRoot),
  path.resolve(workspaceRoot, '..', 'ts-rosa'),
];

module.exports = config;
