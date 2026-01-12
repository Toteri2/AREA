import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiSlice } from '../services/api';
import type { TokenStorage } from '../storage';
import type { ApiAuthResponse, AuthState, User } from '../types';

// Store the token handling

export const persistToken = createAsyncThunk(
  'auth/persistToken',
  async (token: string, { extra, rejectWithValue }) => {
    try {
      const storage = (extra as { storage: TokenStorage }).storage;
      await storage.setToken(token);
      return token;
    } catch (error) {
      console.error('Failed to persist token to storage:', error);
      console.warn(
        'Token persistence failed. You may be logged out on refresh. Check storage quota and permissions.'
      );
      return rejectWithValue(token);
    }
  }
);

// Clear the token from the storage

export const clearToken = createAsyncThunk(
  'auth/clearToken',
  async (_, { extra }) => {
    try {
      const storage = (extra as { storage: TokenStorage }).storage;
      await storage.removeToken();
      return null;
    } catch (error) {
      console.error('Failed to clear token from storage:', error);
      return null;
    }
  }
);

// Load token if present

export const loadToken = createAsyncThunk(
  'auth/loadToken',
  async (_, { extra }) => {
    try {
      const storage = (extra as { storage: TokenStorage }).storage;
      return await storage.getToken();
    } catch (error) {
      console.error('Failed to load token from storage:', error);
      return null;
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  // These reducers react to actions dispatched from other parts of the application
  extraReducers: (builder) => {
    builder
      .addMatcher(
        apiSlice.endpoints.login.matchFulfilled,
        (state, { payload }: PayloadAction<ApiAuthResponse>) => {
          state.user = payload.user;
        }
      )
      .addMatcher(
        apiSlice.endpoints.validateGoogle.matchFulfilled,
        (state, { payload }: PayloadAction<ApiAuthResponse>) => {
          state.user = payload.user;
        }
      )
      .addMatcher(
        apiSlice.endpoints.getProfile.matchFulfilled,
        (state, { payload }: PayloadAction<User>) => {
          state.user = payload;
          state.isAuthenticated = !!state.token;
        }
      )
      .addMatcher(
        isAnyOf(
          persistToken.fulfilled,
          loadToken.fulfilled,
          clearToken.fulfilled
        ),
        (state, action: PayloadAction<string | null>) => {
          state.token = action.payload;
          state.isAuthenticated = !!action.payload;
        }
      )
      .addMatcher(isAnyOf(persistToken.rejected), (state, action) => {
        const token = action.meta.arg as string;
        state.token = token;
        state.isAuthenticated = !!token;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
