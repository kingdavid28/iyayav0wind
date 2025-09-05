const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable console logs in production
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;