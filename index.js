/**
 * @format
 */

// IMPORTANT: react-native-get-random-values must be imported FIRST
// before any other imports that use crypto
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import { Buffer } from 'buffer';
import process from 'process';
import stream from 'readable-stream';

// Polyfill Buffer, process, and stream for React Native
global.Buffer = Buffer;
global.process = process;
// Make stream available globally for modules that require('stream')
if (typeof global.stream === 'undefined') {
  global.stream = stream;
}

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
