import '@testing-library/jest-native/extend-expect';

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Redux store si nécessaire
jest.mock('./src/shared/src/features/authSlice', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock du module shared si nécessaire
jest.mock('./src/shared/src/native', () => ({
  __esModule: true,
}));
