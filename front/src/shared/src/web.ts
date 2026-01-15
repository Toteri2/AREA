import { loadToken } from './features/authSlice';
import { setBaseUrl } from './features/configSlice';
import type { TokenStorage } from './storage';
import { createStore } from './store';

const webStorage: TokenStorage = {
  getToken: async () => localStorage.getItem('area_token'),
  setToken: async (token: string) => localStorage.setItem('area_token', token),
  removeToken: async () => localStorage.removeItem('area_token'),
};

export const store = createStore({
  storage: webStorage,
});

// Validate production configuration
const baseUrl = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL ||
    (() => {
      throw new Error(
        'VITE_API_URL environment variable is required in production mode. ' +
          'Please set it in your .env.production file or build environment.'
      );
    })()
  : '/api';
store.dispatch(setBaseUrl(baseUrl));

// Load the token on startup (avoid deconnexion every refresh)
store.dispatch(loadToken());

export * from '.';
