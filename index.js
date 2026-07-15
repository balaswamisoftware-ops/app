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

// Cap how much the OS font-size setting can enlarge text, so very large
// accessibility fonts never break layouts on any device.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = 1.3;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.3;

AppRegistry.registerComponent(appName, () => App);
