import { api } from './client'
import type { User, AuthResponse } from '../types'

export const authApi = {
  register: async (email: string, password: string, name: string): Promise<User> => {
    const response = await api.post('/auth/register', { email, password, name })
    return response.data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  getGithubAuthUrl: async (): Promise<string> => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/auth/github`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log(response);
    const data = await response.json();
    return data.url;
  },
}

