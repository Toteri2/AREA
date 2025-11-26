import type { AuthResponse, User } from '../types';
import { api } from './client';

export const authApi = {
  register: async (email: string, password: string, name: string): Promise<User> => {
    try {
      const response = await api.post('/auth/register', { email, password, name })
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message
      throw new Error(message)
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getGithubAuthUrl: async (): Promise<string> => {
    const api_url = import.meta.env.VITE_API_URL;
    const client_id = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirect_uri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
    const token = localStorage.getItem('token');

    const jwt_state = await fetch(`${api_url}/auth/github/state`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.text())
      .catch((err) => {
        console.error('Error fetching JWT state:', err);
        return '';
      });

    const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${jwt_state}&redirect_uri=${redirect_uri}&scope=user:email repo write:repo_hook`;
    return authorizeUrl;
  },
};
