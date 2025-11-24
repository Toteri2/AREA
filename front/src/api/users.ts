import { api } from './client'
import type { User } from '../types'

export const usersApi = {
  create: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/users', { email, password })
    return response.data
  },

  findAll: async (): Promise<User[]> => {
    const response = await api.get('/users')
    return response.data
  },

  findOne: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  update: async (id: number, data: { email?: string }): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
