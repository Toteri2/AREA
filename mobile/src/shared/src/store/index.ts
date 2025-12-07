import {
  configureStore,
  isRejectedWithValue,
  type Middleware,
} from '@reduxjs/toolkit';
import authReducer, { clearToken, logout } from '../features/authSlice';
import configReducer from '../features/configSlice';
import { apiSlice } from '../services/api';
import type { TokenStorage } from '../storage';

const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.group('RTK Query Error');
    console.error('An API error occurred:', action.payload);
    console.groupEnd();
  }
  return next(action);
};

// Auto clear token on logout
const logoutMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  if (logout.match(action)) {
    (store.dispatch as unknown as AppDispatch)(clearToken());
  }
  return result;
};

// Redux Store (will break the app easily on modification)
export const createStore = (config: { storage: TokenStorage }) => {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      config: configReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: { storage: config.storage },
        },
      }).concat(apiSlice.middleware, logoutMiddleware, rtkQueryErrorLogger),
  });
};

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
