// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, "env"],
    extraNodeModules: {
      "react-native-keyboard-controller":
        __dirname + "/src/shims/react-native-keyboard-controller.js",
    },
  },
};
