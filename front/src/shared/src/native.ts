import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-expect-error - __DEV__ is a global variable provided by React Native
declare const __DEV__: boolean;

import { loadToken } from './features/authSlice';
import { setBaseUrl } from './features/configSlice';
import type { TokenStorage } from './storage';
import { createStore } from './store';

const nativeStorage: TokenStorage = {
  getToken: () => AsyncStorage.getItem('token'),
  setToken: (token: string) => AsyncStorage.setItem('token', token),
  removeToken: () => AsyncStorage.removeItem('token'),
};

export const store = createStore({
  storage: nativeStorage,
  devTools: __DEV__,
});

const initializeBaseUrl = async () => {
  const savedBaseUrl = await AsyncStorage.getItem('baseUrl');
  const baseUrl = savedBaseUrl || 'https://api.mambokara.dev';
  store.dispatch(setBaseUrl(baseUrl));
};

initializeBaseUrl();
store.dispatch(loadToken());

export * from '.';
