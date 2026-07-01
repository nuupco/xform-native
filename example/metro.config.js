const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const tsRosaRoot = path.resolve(projectRoot, '../../ts-rosa');

const config = getDefaultConfig(projectRoot);

// Enable "react-native" export condition so Metro resolves to src/ not lib/
config.resolver.unstable_conditions = ['react-native'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Watch parent workspace + ts-rosa source
config.watchFolders = [workspaceRoot, tsRosaRoot];

// Allow resolving deps from example's node_modules even from parent source
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force react / react-native (and their subpaths) to ALWAYS resolve to the
// example's copy, regardless of where the importing module lives.
//
// The local packages (@nuup/xform-native, ts-rosa) are symlinked into
// example/node_modules but their real source lives in the parent workspace,
// which ships its own react-native (0.79.7). Node's upward module resolution
// finds that copy first, so a bare `import { Text } from 'react-native'` inside
// the package binds against 0.79.7 while the host app runs 0.85.3 (Fabric).
// The result: <View> renders but <Text> comes up empty (incompatible native
// component registration). extraNodeModules can't fix this because it only
// kicks in when normal resolution FAILS — here it succeeds with the wrong copy.
// resolveRequest intercepts unconditionally, which is the only reliable fix.
const singletons = {
  react: path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [pkg, pkgRoot] of Object.entries(singletons)) {
    if (moduleName === pkg || moduleName.startsWith(`${pkg}/`)) {
      const subpath = moduleName.slice(pkg.length); // '' or '/sub/path'
      return context.resolveRequest(
        context,
        subpath ? path.join(pkgRoot, subpath) : pkgRoot,
        platform
      );
    }
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
