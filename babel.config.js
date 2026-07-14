module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    // Zod v4's ESM uses `export * as ns` — RN's preset needs this to transform it.
    '@babel/plugin-transform-export-namespace-from',
    // Must stay last. Reanimated v4 ships its Babel plugin via react-native-worklets.
    'react-native-worklets/plugin',
  ],
};
