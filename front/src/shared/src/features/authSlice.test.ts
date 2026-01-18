import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import type { AuthState } from '../types';
import authReducer, {
  clearToken,
  loadToken,
  logout,
  persistToken,
} from './authSlice';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  const mockUser = {
    id: 123,
    name: 'Test User',
    email: 'test@example.com',
  };

  describe('reducers', () => {
    it('handles logout action', () => {
      const stateWithUser: AuthState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
      };

      const newState = authReducer(stateWithUser, logout());

      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
    });

    it('returns initial state when state is undefined', () => {
      const newState = authReducer(undefined, { type: 'unknown' });
      expect(newState).toEqual(initialState);
    });
  });

  describe('async thunks with store', () => {
    it('persistToken updates state on success', async () => {
      const mockStorage = {
        getToken: vi.fn(),
        setToken: vi.fn().mockResolvedValue(undefined),
        removeToken: vi.fn(),
      };

      const store = configureStore({
        reducer: { auth: authReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: { extraArgument: { storage: mockStorage } },
          }),
      });

      await store.dispatch(persistToken('new-token'));

      const state = store.getState().auth;
      expect(state.token).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
      expect(mockStorage.setToken).toHaveBeenCalledWith('new-token');
    });

    it('persistToken handles rejection gracefully', async () => {
      const mockStorage = {
        getToken: vi.fn(),
        setToken: vi.fn().mockRejectedValue(new Error('Storage full')),
        removeToken: vi.fn(),
      };

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const store = configureStore({
        reducer: { auth: authReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: { extraArgument: { storage: mockStorage } },
          }),
      });

      await store.dispatch(persistToken('new-token'));

      const state = store.getState().auth;
      expect(state.token).toBe('new-token');
      expect(state.isAuthenticated).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('loadToken loads existing token', async () => {
      const mockStorage = {
        getToken: vi.fn().mockResolvedValue('existing-token'),
        setToken: vi.fn(),
        removeToken: vi.fn(),
      };

      const store = configureStore({
        reducer: { auth: authReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: { extraArgument: { storage: mockStorage } },
          }),
      });

      await store.dispatch(loadToken());

      const state = store.getState().auth;
      expect(state.token).toBe('existing-token');
      expect(state.isAuthenticated).toBe(true);
    });

    it('clearToken removes token', async () => {
      const mockStorage = {
        getToken: vi.fn(),
        setToken: vi.fn(),
        removeToken: vi.fn().mockResolvedValue(undefined),
      };

      const store = configureStore({
        reducer: { auth: authReducer },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            thunk: { extraArgument: { storage: mockStorage } },
          }),
      });

      await store.dispatch(persistToken('token-to-clear'));
      expect(store.getState().auth.token).toBe('token-to-clear');

      await store.dispatch(clearToken());

      const state = store.getState().auth;
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockStorage.removeToken).toHaveBeenCalled();
    });
  });
});
