const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable console logs in production builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver alias for react-native-keyboard-controller shim
config.resolver.alias = {
  'react-native-keyboard-controller': path.resolve(__dirname, 'src/shims/react-native-keyboard-controller.js'),
};

// Ensure the resolver resolves the shim correctly
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure console logs are visible
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;