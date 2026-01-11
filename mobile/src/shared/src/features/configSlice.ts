import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface ConfigState {
  baseUrl: string;
}

const initialState: ConfigState = {
  baseUrl: 'http://api.mambokara.dev',
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setBaseUrl: (state, action: PayloadAction<string>) => {
      state.baseUrl = action.payload;
    },
  },
});

export const { setBaseUrl } = configSlice.actions;
export default configSlice.reducer;
