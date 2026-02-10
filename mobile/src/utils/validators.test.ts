// Tests simples des utilitaires et helpers
describe('App Utils', () => {
  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'not-an-email';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('should validate password requirements', () => {
    const weakPassword = 'weak';
    const strongPassword = 'Strong123!';

    const hasMinLength = (pwd: string) => pwd.length >= 8;
    const hasUpperCase = (pwd: string) => /[A-Z]/.test(pwd);
    const hasLowerCase = (pwd: string) => /[a-z]/.test(pwd);
    const hasNumber = (pwd: string) => /[0-9]/.test(pwd);
    const hasSpecialChar = (pwd: string) => /[\W_]/.test(pwd);

    expect(hasMinLength(weakPassword)).toBe(false);
    expect(hasMinLength(strongPassword)).toBe(true);

    expect(hasUpperCase(strongPassword)).toBe(true);
    expect(hasLowerCase(strongPassword)).toBe(true);
    expect(hasNumber(strongPassword)).toBe(true);
    expect(hasSpecialChar(strongPassword)).toBe(true);
  });

  it('should validate URL format', () => {
    const httpUrl = 'http://example.com';
    const httpsUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';

    const isValidUrl = (url: string) =>
      url.startsWith('http://') || url.startsWith('https://');

    expect(isValidUrl(httpUrl)).toBe(true);
    expect(isValidUrl(httpsUrl)).toBe(true);
    expect(isValidUrl(invalidUrl)).toBe(false);
  });

  it('should handle route names', () => {
    const routes = {
      Login: 'Login',
      Register: 'Register',
      Dashboard: 'Dashboard',
      Profile: 'Profile',
      Area: 'Area',
    };

    expect(routes.Login).toBe('Login');
    expect(routes.Dashboard).toBe('Dashboard');
    expect(Object.keys(routes)).toHaveLength(5);
  });

  it('should validate allowed URLs for WebView', () => {
    const allowedUrl = 'https://front.mambokara.dev/page';
    const areaProtocol = 'area://action';
    const forbiddenUrl = 'https://malicious.com';

    const isUrlAllowed = (url: string) =>
      url.startsWith('https://front.mambokara.dev') ||
      url.startsWith('area://');

    expect(isUrlAllowed(allowedUrl)).toBe(true);
    expect(isUrlAllowed(areaProtocol)).toBe(true);
    expect(isUrlAllowed(forbiddenUrl)).toBe(false);
  });
});
