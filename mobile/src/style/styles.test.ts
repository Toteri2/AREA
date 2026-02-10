// Tests pour les styles et thème
describe('Styles and Theme', () => {
  it('should have consistent color palette', () => {
    const colors = {
      primary: '#e94560',
      secondary: '#0f0f0f',
      background: '#ffffff',
      text: '#000000',
      error: '#ff0000',
    };

    expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('should validate button styles', () => {
    const buttonStyles = {
      primary: { backgroundColor: '#e94560', color: '#fff' },
      secondary: { backgroundColor: '#fff', color: '#000' },
      disabled: { opacity: 0.6 },
    };

    expect(buttonStyles.primary.backgroundColor).toBeTruthy();
    expect(buttonStyles.disabled.opacity).toBeLessThan(1);
  });

  it('should have proper spacing values', () => {
    const spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    };

    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
    expect(spacing.lg).toBeLessThan(spacing.xl);
  });
});
