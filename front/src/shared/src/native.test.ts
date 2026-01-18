git import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AsyncStorage avant l'import
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
const mockRemoveItem = vi.fn();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  },
}));

// Mock Redux store
const mockDispatch = vi.fn();
const mockGetState = vi.fn();
const mockSubscribe = vi.fn();
const mockReplaceReducer = vi.fn();

vi.mock('./store', () => ({
  createStore: vi.fn(() => ({
    dispatch: mockDispatch,
    getState: mockGetState,
    subscribe: mockSubscribe,
    replaceReducer: mockReplaceReducer,
  })),
}));

vi.mock('./features/authSlice', () => ({
  loadToken: vi.fn(() => ({ type: 'auth/loadToken' })),
}));

vi.mock('./features/configSlice', () => ({
  setBaseUrl: vi.fn((url: string) => ({ type: 'config/setBaseUrl', payload: url })),
}));

describe('native.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('nativeStorage', () => {
    it('should get token from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue('test-token');

      // Import après le mock
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      
      const token = await AsyncStorage.getItem('token');
      
      expect(mockGetItem).toHaveBeenCalledWith('token');
      expect(token).toBe('test-token');
    });

    it('should set token in AsyncStorage', async () => {
      mockSetItem.mockResolvedValue(undefined);

      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      
      await AsyncStorage.setItem('token', 'new-token');
      
      expect(mockSetItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('should remove token from AsyncStorage', async () => {
      mockRemoveItem.mockResolvedValue(undefined);

      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      
      await AsyncStorage.removeItem('token');
      
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
    });
  });

  describe('store initialization', () => {
    it('should create store with native storage', async () => {
      const { createStore } = await import('./store');
      
      expect(createStore).toHaveBeenCalled();
      const createStoreCall = vi.mocked(createStore).mock.calls[0][0];
      
      expect(createStoreCall).toHaveProperty('storage');
      expect(createStoreCall).toHaveProperty('devTools');
    });

    it('should dispatch loadToken on initialization', async () => {
      const { loadToken } = await import('./features/authSlice');
      
      expect(mockDispatch).toHaveBeenCalled();
      expect(loadToken).toHaveBeenCalled();
    });
  });

  describe('initializeBaseUrl', () => {
    it('should use saved baseUrl from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue('https://custom-api.com');
      
      const { setBaseUrl } = await import('./features/configSlice');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetItem).toHaveBeenCalledWith('baseUrl');
      expect(setBaseUrl).toHaveBeenCalledWith('https://custom-api.com');
    });

    it('should use default baseUrl when no saved value', async () => {
      mockGetItem.mockResolvedValue(null);
      
      const { setBaseUrl } = await import('./features/configSlice');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockGetItem).toHaveBeenCalledWith('baseUrl');
      expect(setBaseUrl).toHaveBeenCalledWith('https://api.mambokara.dev');
    });
  });

  describe('storage interface', () => {
    it('should implement TokenStorage interface correctly', async () => {
      const { createStore } = await import('./store');
      const createStoreCall = vi.mocked(createStore).mock.calls[0][0];
      const storage = createStoreCall.storage;

      expect(storage).toBeDefined();
      expect(typeof storage.getToken).toBe('function');
      expect(typeof storage.setToken).toBe('function');
      expect(typeof storage.removeToken).toBe('function');
    });

    it('should handle token operations', async () => {
      mockGetItem.mockResolvedValue('stored-token');
      mockSetItem.mockResolvedValue(undefined);
      mockRemoveItem.mockResolvedValue(undefined);

      const { createStore } = await import('./store');
      const createStoreCall = vi.mocked(createStore).mock.calls[0][0];
      const storage = createStoreCall.storage;

      // Test getToken
      const token = await storage.getToken();
      expect(token).toBe('stored-token');
      expect(mockGetItem).toHaveBeenCalledWith('token');

      // Test setToken
      await storage.setToken('new-token');
      expect(mockSetItem).toHaveBeenCalledWith('token', 'new-token');

      // Test removeToken
      await storage.removeToken();
      expect(mockRemoveItem).toHaveBeenCalledWith('token');
    });
  });
});
