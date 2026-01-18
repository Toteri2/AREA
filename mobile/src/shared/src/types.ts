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
