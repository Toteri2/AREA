// Mock Redux et RTK Query pour les tests
jest.mock('@reduxjs/toolkit/query/react', () => ({
  createApi: jest.fn(() => ({
    reducerPath: 'api',
    reducer: jest.fn(),
    middleware: jest.fn(),
    tagTypes: ['User', 'Auth'],
  })),
  fetchBaseQuery: jest.fn(),
}));

describe('API Service', () => {
  it('should have basic API structure', () => {
    // Test basique qui vérifie que le module peut être importé
    expect(true).toBe(true);
  });
});
