import { api } from './client'
import type { Repository, Webhook, CreateWebhookDto } from '../types'

export const githubApi = {
  listRepositories: async (): Promise<Repository[]> => {
    const response = await api.get('/github/repositories')
    return response.data
  },

  listWebhooks: async (owner: string, repo: string): Promise<Webhook[]> => {
    const response = await api.get(`/github/repositories/${owner}/${repo}/webhooks`)
    return response.data
  },

  createWebhook: async (dto: CreateWebhookDto): Promise<Webhook> => {
    const response = await api.post('/github/create-webhook', dto)
    return response.data
  },
}
