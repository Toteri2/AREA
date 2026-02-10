import configReducer, { setBaseUrl } from './configSlice';

describe('configSlice', () => {
  const initialState = {
    baseUrl: 'https://api.mambokara.dev',
  };

  it('should return initial state', () => {
    expect(configReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setBaseUrl', () => {
    const newUrl = 'https://api.newserver.com';
    const actual = configReducer(initialState, setBaseUrl(newUrl));

    expect(actual.baseUrl).toBe(newUrl);
  });

  it('should update baseUrl from existing state', () => {
    const existingState = {
      baseUrl: 'https://old-api.com',
    };

    const newUrl = 'https://new-api.com';
    const actual = configReducer(existingState, setBaseUrl(newUrl));

    expect(actual.baseUrl).toBe(newUrl);
  });

  it('should handle empty string as baseUrl', () => {
    const actual = configReducer(initialState, setBaseUrl(''));

    expect(actual.baseUrl).toBe('');
  });

  it('should handle baseUrl with path', () => {
    const urlWithPath = 'https://api.example.com/v1';
    const actual = configReducer(initialState, setBaseUrl(urlWithPath));

    expect(actual.baseUrl).toBe(urlWithPath);
  });
});
