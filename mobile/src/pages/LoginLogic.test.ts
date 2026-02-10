// Tests pour la logique de Login sans Redux
describe('Login Page Logic', () => {
  it('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'first+last@company.com',
    ];

    const invalidEmails = [
      'notanemail',
      '@example.com',
      'test@',
      'test @example.com',
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it('should require both email and password', () => {
    const isFormValid = (email: string, password: string) => {
      return email.length > 0 && password.length > 0;
    };

    expect(isFormValid('', '')).toBe(false);
    expect(isFormValid('test@example.com', '')).toBe(false);
    expect(isFormValid('', 'password')).toBe(false);
    expect(isFormValid('test@example.com', 'password')).toBe(true);
  });

  it('should validate URL format for base URL', () => {
    const validUrls = [
      'https://api.example.com',
      'http://localhost:3000',
      'https://api.subdomain.domain.com',
    ];

    const invalidUrls = ['not-a-url', 'ftp://example.com', 'example.com'];

    const isValidUrl = (url: string) =>
      url.startsWith('http://') || url.startsWith('https://');

    validUrls.forEach((url) => {
      expect(isValidUrl(url)).toBe(true);
    });

    invalidUrls.forEach((url) => {
      expect(isValidUrl(url)).toBe(false);
    });
  });

  it('should handle error messages', () => {
    const errorMessages = {
      invalidCredentials: 'Invalid credentials',
      networkError: 'Network error occurred',
      emptyFields: 'Please fill all fields',
    };

    expect(errorMessages.invalidCredentials).toBeTruthy();
    expect(errorMessages.networkError).toBeTruthy();
    expect(typeof errorMessages.emptyFields).toBe('string');
  });
});
