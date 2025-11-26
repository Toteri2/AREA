import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://michelle-perinephric-prefixally.ngrok-free.dev';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },
  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem('token', token);
  },
  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
  },
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);
