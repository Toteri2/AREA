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

// Hook entity from backend (used by /users/webhooks)
export interface Hook {
  id: number;
  userId: number;
  webhookId: string;
  service: string;
  lastHistoryId?: string;
  eventType?: number;
  config?: {
    repo?: string;
    events?: string[];
    [key: string]: unknown;
  };
  additionalInfos?: Record<string, unknown>;
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

// Discord types

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export interface DiscordWebhook {
  id: string;
  guildId: string;
  channelId: string;
  events: string[];
}

// Jira types

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraWebhook {
  id: string;
  projectKey: string;
  events: string[];
}

export type AboutService = {
  name: string;
  actions: {
    name: string;
    description: string;
  }[];
  reactions: {
    name: string;
    description: string;
  }[];
};

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
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReactionDto {
  name: string;
  hookId: number | string;
  reactionType: number;
  config: {
    to?: string;
    subject?: string;
    body?: string;
    webhookUrl?: string;
    message?: string;
    url?: string;
    [key: string]: unknown;
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

// Blueprint Types for Visual Editor

export type ServiceType =
  | 'github'
  | 'gmail'
  | 'microsoft'
  | 'jira'
  | 'discord'
  | 'twitch';

export interface ActionNodeData {
  label: string;
  service: ServiceType;
  eventType: string;
  webhookId?: string | number; // Can be number (Hook.id) or string (MS Graph UUID)
  config: Record<string, unknown>;
  isConfigured: boolean;
}

export interface ReactionNodeData {
  label: string;
  reactionType: number;
  reactionName?: string; // Name from API (e.g., 'send_message')
  serviceName?: string; // Service from API (e.g., 'discord')
  config: {
    to?: string;
    subject?: string;
    body?: string;
    webhookUrl?: string;
    message?: string;
    url?: string;
    [key: string]: unknown;
  };
  isConfigured: boolean;
}
