const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the parent workspace so Metro picks up ts-rosa and xform-native source
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(projectRoot, '..'),
  path.resolve(workspaceRoot, 'ts-rosa'),
];

// Resolve @nuup/xform-native to source for live reload
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
