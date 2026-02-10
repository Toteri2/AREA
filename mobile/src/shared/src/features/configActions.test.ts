import { setBaseUrl } from './configSlice';

describe('configSlice Actions', () => {
  it('should create setBaseUrl action', () => {
    const url = 'https://api.example.com';
    const action = setBaseUrl(url);

    expect(action.type).toBe('config/setBaseUrl');
    expect(action.payload).toBe(url);
  });

  it('should create setBaseUrl action with empty string', () => {
    const action = setBaseUrl('');

    expect(action.type).toBe('config/setBaseUrl');
    expect(action.payload).toBe('');
  });
});
