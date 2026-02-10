// Tests pour la logique Profile
describe('Profile Page Logic', () => {
  it('should validate service names', () => {
    const validServices = [
      'github',
      'gmail',
      'microsoft',
      'discord',
      'jira',
      'twitch',
    ];

    const isValidService = (serviceName: string) => {
      return validServices.includes(serviceName.toLowerCase());
    };

    expect(isValidService('github')).toBe(true);
    expect(isValidService('Gmail')).toBe(true);
    expect(isValidService('DISCORD')).toBe(true);
    expect(isValidService('invalid')).toBe(false);
  });

  it('should determine if service is linked', () => {
    const mockConnections = {
      github: { connected: true },
      gmail: { connected: false },
    };

    const isServiceLinked = (service: string) => {
      return (
        mockConnections[service as keyof typeof mockConnections]?.connected ||
        false
      );
    };

    expect(isServiceLinked('github')).toBe(true);
    expect(isServiceLinked('gmail')).toBe(false);
    expect(isServiceLinked('unknown')).toBe(false);
  });

  it('should validate base URL format', () => {
    const isValidBaseUrl = (url: string) => {
      return url.startsWith('http://') || url.startsWith('https://');
    };

    expect(isValidBaseUrl('https://api.example.com')).toBe(true);
    expect(isValidBaseUrl('http://localhost:3000')).toBe(true);
    expect(isValidBaseUrl('ftp://server.com')).toBe(false);
    expect(isValidBaseUrl('not-a-url')).toBe(false);
  });

  it('should handle logout navigation', () => {
    const navigationStack = {
      reset: (config: { index: number; routes: { name: string }[] }) => config,
    };

    const logoutConfig = navigationStack.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

    expect(logoutConfig.index).toBe(0);
    expect(logoutConfig.routes[0].name).toBe('Login');
  });

  it('should format service linker button text', () => {
    const getButtonText = (serviceName: string, isLinked: boolean) => {
      return isLinked
        ? `✓ ${serviceName} Account Linked`
        : `Link ${serviceName} Account`;
    };

    expect(getButtonText('GitHub', true)).toBe('✓ GitHub Account Linked');
    expect(getButtonText('Gmail', false)).toBe('Link Gmail Account');
  });
});
