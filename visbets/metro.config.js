// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// Substitute native-only modules with mocks ONLY when explicitly requested.
//
// In dev-client, preview, and production EAS builds the real native
// modules (Google Sign-In, RevenueCat) are compiled into the binary.
// Unconditionally replacing them with mocks causes silent auth failures:
// Google Sign-In throws "not available in Expo Go" even on real devices.
//
// Set USE_NATIVE_MOCKS=1 in your shell when running `expo start` with
// Expo Go (where the native modules genuinely don't exist):
//
//   USE_NATIVE_MOCKS=1 npx expo start
//
const useNativeMocks = process.env.USE_NATIVE_MOCKS === '1';

if (useNativeMocks) {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-purchases': path.resolve(__dirname, 'src/mocks/react-native-purchases.ts'),
    '@react-native-google-signin/google-signin': path.resolve(__dirname, 'src/mocks/react-native-google-signin.ts'),
  };
}

module.exports = config;
