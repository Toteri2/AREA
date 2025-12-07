import { loadToken } from './features/authSlice';
import { setBaseUrl } from './features/configSlice';
import type { TokenStorage } from './storage';
import { createStore } from './store';

const webStorage: TokenStorage = {
  getToken: async () => localStorage.getItem('token'),
  setToken: async (token: string) => localStorage.setItem('token', token),
  removeToken: async () => localStorage.removeItem('token'),
};

export const store = createStore({
  storage: webStorage,
});

const baseUrl = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'http://localhost:8080'
  : '/api';
store.dispatch(setBaseUrl(baseUrl));

// Load the token on startup (avoid deconnexion every refresh)
store.dispatch(loadToken());

export * from '.';
