// babel-preset-expo (SDK 57) auto-configures the react-native-worklets /
// Reanimated plugin when those packages are installed — no manual entry
// needed. NativeWind requires `jsxImportSource: "nativewind"` + its own
// preset.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
