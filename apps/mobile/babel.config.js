module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // this already includes expo-router transforms
    plugins: [
      'react-native-reanimated/plugin', // must be last
    ],
  };
};
