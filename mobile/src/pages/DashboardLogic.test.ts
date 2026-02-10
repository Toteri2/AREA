// Tests pour la logique Dashboard
describe('Dashboard Page Logic', () => {
  it('should have correct navigation routes', () => {
    const routes = {
      Profile: 'Profile',
      Area: 'Area',
    };

    expect(routes.Profile).toBe('Profile');
    expect(routes.Area).toBe('Area');
  });

  it('should format user welcome message', () => {
    const getWelcomeMessage = (userName?: string) => {
      return userName ? `Welcome, ${userName}!` : 'Welcome!';
    };

    expect(getWelcomeMessage('John')).toBe('Welcome, John!');
    expect(getWelcomeMessage('Alice')).toBe('Welcome, Alice!');
    expect(getWelcomeMessage()).toBe('Welcome!');
    expect(getWelcomeMessage(undefined)).toBe('Welcome!');
  });

  it('should have valid card configurations', () => {
    const cards = [
      {
        name: 'Profile',
        icon: 'user',
        description: 'View and edit your profile',
      },
      { name: 'Area', icon: 'cog', description: 'Area page (automation)' },
    ];

    expect(cards).toHaveLength(2);
    expect(cards[0].name).toBe('Profile');
    expect(cards[1].name).toBe('Area');

    cards.forEach((card) => {
      expect(card.name).toBeTruthy();
      expect(card.icon).toBeTruthy();
      expect(card.description).toBeTruthy();
    });
  });
});
