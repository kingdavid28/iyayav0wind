// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any additional asset extensions if needed
config.resolver.assetExts.push('db');

module.exports = config;