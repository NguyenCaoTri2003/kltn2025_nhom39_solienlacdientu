const { getDefaultConfig } = require('expo/metro-config'); 
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'packages'),
};

config.watchFolders = [path.resolve(__dirname, 'packages')];

module.exports = config;
