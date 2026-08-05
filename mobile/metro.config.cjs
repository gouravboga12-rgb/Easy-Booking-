const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('react-router') || moduleName.startsWith('react-map-gl')) {
    return context.resolveRequest({
      ...context,
      unstable_enablePackageExports: true,
    }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
