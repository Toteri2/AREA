// Parent TokenStorage definition for web and mobile

export interface TokenStorage {
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
}
