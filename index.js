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
// "Font size" setting. This UI is pixel-tuned (the fixed 300px SVG mala, the
// circular gauges, the stat tiles, the Nakshatram dropdown), and a large system
// font would previously enlarge text up to 1.3x and clip the last word of many
// labels ("of 108" -> "of", "Total chants" -> "Total", "will sync" -> "will").
// Fixing font scaling to 1x keeps every layout intact on every device.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.maxFontSizeMultiplier = 1;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.maxFontSizeMultiplier = 1;

AppRegistry.registerComponent(appName, () => App);
