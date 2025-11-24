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
    const response = await api.get('/auth/github')
    return response.data.url
  },
}
