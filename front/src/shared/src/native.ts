import AsyncStorage from '@react-native-async-storage/async-storage';
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
});

const initializeBaseUrl = async () => {
  const savedBaseUrl = await AsyncStorage.getItem('baseUrl');
  const baseUrl = savedBaseUrl || 'https://api.mambokara.dev';
  store.dispatch(setBaseUrl(baseUrl));
};

initializeBaseUrl();
store.dispatch(loadToken());

export * from '.';
