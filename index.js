/**
 * @format
 */

import { AppRegistry, LogBox, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Hide the on-screen dev warning/notification overlay (the yellow LogBox box).
// This is DEVELOPMENT-ONLY — LogBox does not exist in release builds, so the
// published app is unaffected. Fatal red-screen errors still show.
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

// Render text at the app's designed size regardless of the device's system
// "Font size" setting. This UI is pixel-tuned (the fixed SVG mala, circular
// gauges, stat tiles, dropdowns), and a large system font enlarges text and
// clips the last word of many labels ("of 108" -> "of", "…to go" -> "…to").
//
// NOTE: React 19 IGNORES `defaultProps` on function components, so the old
// `Text.defaultProps.allowFontScaling = false` did nothing (RN's Text/TextInput
// are forwardRef function components). We instead override the component's
// render to force `allowFontScaling` off on every instance — this also reaches
// NativeWind, which renders the underlying RN Text.
function forceNoFontScaling(Component) {
  const original = Component && Component.render;
  if (typeof original !== 'function') return;
  Component.render = function (props, ref) {
    return original.call(this, { ...props, allowFontScaling: false }, ref);
  };
}
forceNoFontScaling(Text);
forceNoFontScaling(TextInput);

AppRegistry.registerComponent(appName, () => App);
