export interface User {
  id: number
  email: string
  name: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface Webhook {
  id: number
  name: string
  active: boolean
  events: string[]
  config: {
    url: string
    content_type: string
  }
}

export interface CreateWebhookDto {
  owner: string
  repo: string
  url: string
  events: string[]
  secret?: string
}
