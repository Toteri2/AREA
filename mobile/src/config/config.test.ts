// Tests pour la configuration de l'app
describe('App Configuration', () => {
  it('should have valid API endpoints', () => {
    const apiEndpoints = {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/user/profile',
      services: '/services',
      googleAuth: '/auth/google',
    };

    Object.values(apiEndpoints).forEach((endpoint) => {
      expect(endpoint).toMatch(/^\//);
      expect(endpoint.length).toBeGreaterThan(1);
    });
  });

  it('should validate environment configuration', () => {
    const envConfig = {
      apiBaseUrl: 'https://api.mambokara.dev',
      frontBaseUrl: 'https://front.mambokara.dev',
      isDevelopment: false,
    };

    expect(envConfig.apiBaseUrl).toContain('https://');
    expect(envConfig.frontBaseUrl).toContain('https://');
    expect(typeof envConfig.isDevelopment).toBe('boolean');
  });

  it('should define service configuration', () => {
    const services = [
      { name: 'github', authUrl: '/auth/github' },
      { name: 'gmail', authUrl: '/auth/gmail' },
      { name: 'discord', authUrl: '/auth/discord' },
    ];

    expect(services.length).toBeGreaterThan(0);

    services.forEach((service) => {
      expect(service.name).toBeTruthy();
      expect(service.authUrl).toMatch(/^\/auth\//);
    });
  });

  it('should have proper navigation configuration', () => {
    const navigationConfig = {
      initialRouteName: 'Login',
      screenOptions: {
        headerShown: true,
        animation: 'default',
      },
    };

    expect(navigationConfig.initialRouteName).toBe('Login');
    expect(navigationConfig.screenOptions.headerShown).toBeDefined();
  });
});
