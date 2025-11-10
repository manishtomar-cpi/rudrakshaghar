const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Stop Metro from walking up the monorepo and grabbing a different React
config.resolver.disableHierarchicalLookup = true;

// (Optional safety) Pin these to mobile's node_modules
config.resolver.extraNodeModules = {
  react: require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
  'react-native': require.resolve('react-native'),
};

module.exports = config;
