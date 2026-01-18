import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../shared/src/web';
import { GoogleCallback } from './GoogleCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/src/web')>();
  return {
    ...actual,
    useGoogleAuthValidateMutation: vi.fn(),
  };
});

import { useGoogleAuthValidateMutation } from '../shared/src/web';

describe('GoogleCallback', () => {
  const mockGoogleAuthValidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    delete (window as any).location;
    (window as any).location = {
      href: '',
      search: '',
    };
    (useGoogleAuthValidateMutation as unknown as Mock).mockReturnValue([
      mockGoogleAuthValidate,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'test-code';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/google?code=${code}`);
  });

  it('validates Google auth and navigates to dashboard on success', async () => {
    const code = 'test-code';
    window.location.search = `?code=${code}`;

    mockGoogleAuthValidate.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText('Linking your Google account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGoogleAuthValidate).toHaveBeenCalledWith({
        code,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Success! Redirecting...')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
          replace: true,
        });
      },
      { timeout: 1500 }
    );
  });

  it('shows error when validation fails', async () => {
    const code = 'test-code';
    window.location.search = `?code=${code}`;

    mockGoogleAuthValidate.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to link Google account. See console for details.'
        )
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when no access token is returned', async () => {
    const code = 'test-code';
    window.location.search = `?code=${code}`;

    mockGoogleAuthValidate.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to get authentication token.')
      ).toBeInTheDocument();
    });
  });

  it('shows loading indicator when isLoading is true', () => {
    window.location.search = '?code=test-code';

    (useGoogleAuthValidateMutation as unknown as Mock).mockReturnValue([
      mockGoogleAuthValidate,
      { isLoading: true },
    ]);

    mockGoogleAuthValidate.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <GoogleCallback />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });
});
