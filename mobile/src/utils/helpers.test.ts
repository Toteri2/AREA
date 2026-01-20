// Tests pour les helpers et utilitaires
describe('Helper Functions', () => {
  it('should format error messages', () => {
    const formatErrorMessage = (error: any): string => {
      if (error?.data?.message) {
        return error.data.message;
      }
      if (error?.message) {
        return error.message;
      }
      return 'An unexpected error occurred.';
    };

    expect(formatErrorMessage({ data: { message: 'Custom error' } })).toBe(
      'Custom error'
    );
    expect(formatErrorMessage({ message: 'Simple error' })).toBe(
      'Simple error'
    );
    expect(formatErrorMessage({})).toBe('An unexpected error occurred.');
    expect(formatErrorMessage(null)).toBe('An unexpected error occurred.');
  });

  it('should truncate long text', () => {
    const truncate = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    };

    expect(truncate('Short text', 20)).toBe('Short text');
    expect(truncate('This is a very long text that needs truncation', 20)).toBe(
      'This is a very long ...'
    );
    expect(truncate('Exact', 5)).toBe('Exact');
  });

  it('should debounce function calls', () => {
    jest.useFakeTimers();

    const mockFn = jest.fn();
    const debounce = (fn: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should deep clone objects', () => {
    const deepClone = <T>(obj: T): T => {
      return JSON.parse(JSON.stringify(obj));
    };

    const original = { name: 'John', details: { age: 30 } };
    const cloned = deepClone(original);

    cloned.details.age = 40;

    expect(original.details.age).toBe(30);
    expect(cloned.details.age).toBe(40);
  });

  it('should validate array is not empty', () => {
    const isArrayNotEmpty = <T>(arr: T[]): boolean => {
      return Array.isArray(arr) && arr.length > 0;
    };

    expect(isArrayNotEmpty([1, 2, 3])).toBe(true);
    expect(isArrayNotEmpty([])).toBe(false);
    expect(isArrayNotEmpty(['item'])).toBe(true);
  });

  it('should safely access nested properties', () => {
    const getNestedProperty = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const data = {
      user: {
        profile: {
          name: 'John',
        },
      },
    };

    expect(getNestedProperty(data, 'user.profile.name')).toBe('John');
    expect(getNestedProperty(data, 'user.profile.age')).toBeUndefined();
    expect(getNestedProperty(data, 'invalid.path')).toBeUndefined();
  });
});
