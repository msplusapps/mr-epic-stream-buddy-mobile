const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only redirect asset registry on web platform
  if (platform === 'web') {
    if (
      moduleName === 'react-native-web/dist/exports/AssetRegistry' ||
      moduleName === '@react-native/assets-registry/registry' ||
      moduleName === '@react-native/assets-registry'
    ) {
      return {
        filePath: require.resolve('react-native-web/dist/modules/AssetRegistry'),
        type: 'sourceFile',
      };
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
