// Tests pour la logique de Register sans Redux
describe('Register Page Logic', () => {
  it('should validate password strength', () => {
    const checkPasswordStrength = (password: string) => {
      const requirements = [
        { test: (pwd: string) => pwd.length >= 8, label: 'length' },
        { test: (pwd: string) => /[A-Z]/.test(pwd), label: 'uppercase' },
        { test: (pwd: string) => /[a-z]/.test(pwd), label: 'lowercase' },
        { test: (pwd: string) => /[0-9]/.test(pwd), label: 'number' },
        { test: (pwd: string) => /[\W_]/.test(pwd), label: 'special' },
      ];

      return requirements.reduce(
        (score, req) => score + (req.test(password) ? 1 : 0),
        0
      );
    };

    expect(checkPasswordStrength('weak')).toBe(1); // Only lowercase
    expect(checkPasswordStrength('WeakPass')).toBe(3); // uppercase + lowercase + length
    expect(checkPasswordStrength('WeakPass1')).toBe(4); // + number
    expect(checkPasswordStrength('WeakPass1!')).toBe(5); // + special
    expect(checkPasswordStrength('StrongPass123!')).toBe(5); // All requirements
  });

  it('should check if passwords match', () => {
    const doPasswordsMatch = (pwd1: string, pwd2: string) => pwd1 === pwd2;

    expect(doPasswordsMatch('password', 'password')).toBe(true);
    expect(doPasswordsMatch('password', 'Password')).toBe(false);
    expect(doPasswordsMatch('', '')).toBe(true);
  });

  it('should validate email format strictly', () => {
    const isEmailValid = (email: string) => {
      return (
        email.length <= 254 &&
        /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}$/.test(
          email
        )
      );
    };

    expect(isEmailValid('test@example.com')).toBe(true);
    expect(isEmailValid('user+tag@domain.co')).toBe(true);
    expect(isEmailValid('invalid@')).toBe(false);
    expect(isEmailValid('@invalid.com')).toBe(false);
  });

  it('should require all registration fields', () => {
    const areAllFieldsFilled = (
      name: string,
      email: string,
      password: string,
      confirmPassword: string
    ) => {
      return (
        name.length > 0 &&
        email.length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0
      );
    };

    expect(
      areAllFieldsFilled('John', 'john@example.com', 'Pass123!', 'Pass123!')
    ).toBe(true);
    expect(
      areAllFieldsFilled('', 'john@example.com', 'Pass123!', 'Pass123!')
    ).toBe(false);
    expect(areAllFieldsFilled('John', '', 'Pass123!', 'Pass123!')).toBe(false);
  });

  it('should validate password does not contain name', () => {
    const passwordContainsName = (password: string, name: string) => {
      if (!name) return false;
      return new RegExp(name, 'i').test(password);
    };

    expect(passwordContainsName('JohnPass123!', 'John')).toBe(true);
    expect(passwordContainsName('SecurePass123!', 'John')).toBe(false);
    expect(passwordContainsName('Password123!', '')).toBe(false);
  });

  it('should calculate password strength score', () => {
    const getStrengthLabel = (score: number) => {
      if (score === 0) return 'No password';
      if (score <= 2) return 'Weak';
      if (score <= 3) return 'Fair';
      if (score <= 4) return 'Good';
      if (score <= 5) return 'Strong';
      return 'Very Strong';
    };

    expect(getStrengthLabel(0)).toBe('No password');
    expect(getStrengthLabel(2)).toBe('Weak');
    expect(getStrengthLabel(3)).toBe('Fair');
    expect(getStrengthLabel(4)).toBe('Good');
    expect(getStrengthLabel(5)).toBe('Strong');
  });
});
