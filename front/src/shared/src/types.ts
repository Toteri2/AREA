// User & Auth Types

export interface User {
  id: number;
  email: string;
  name: string;
}

// /auth/login API endpoint

export interface ApiAuthResponse {
  access_token: string;
  user: User;
}

// Auth state Redux

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// GitHub Types

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface Webhook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: string;
  };
}

export interface CreateWebhookDto {
  owner: string;
  repo: string;
  webhookUrl: string;
  events: string[];
  secret?: string;
}

//Microsoft type

export interface MicrosoftSubscription {
  id: string;
  resource: string;
  changeType: string;
  clientState: string;
  expirationDateTime: string;
}

//Gmail type

export interface GmailSubscription {
  id: string;
  resource: string;
  changeType: string;
  clientState: string;
  expirationDateTime: string;
}

export interface Reaction {
  id: number;
  hookId: number;
  reactionType: number;
  config: {
    to?: string;
    subject?: string;
    body?: string;
    webhookUrl?: string;
    message?: string;
    url?: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReactionDto {
  hookId: number;
  reactionType: number;
  config: {
    to?: string;
    subject?: string;
    body?: string;
    webhookUrl?: string;
    message?: string;
    url?: string;
    [key: string]: any;
  };
}

// About/Services Types

export interface AboutResponse {
  client: {
    host: string;
  };
  server: {
    current_time: number;
    services: Array<{
      name: string;
      actions: Array<{
        name: string;
        description: string;
      }>;
      reactions: Array<{
        name: string;
        description: string;
      }>;
    }>;
  };
}
