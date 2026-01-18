import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TwitchCallback } from './TwitchCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateTwitchMutation: vi.fn(),
}));

import { useValidateTwitchMutation } from '../shared/src/web';

describe('TwitchCallback', () => {
  const mockValidateTwitch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
    (useValidateTwitchMutation as unknown as Mock).mockReturnValue([
      mockValidateTwitch,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('shows error when no state is provided', () => {
    window.location.search = '?code=test-code';

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Error: No state found.')).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'test-code';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(
      `area://auth/twitch?code=${code}&state=${state}`
    );
  });

  it('validates Twitch auth and navigates to profile on success', async () => {
    const code = 'test-code';
    const state = 'test-state';
    window.location.search = `?code=${code}&state=${state}`;

    mockValidateTwitch.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your Twitch account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateTwitch).toHaveBeenCalledWith({ code, state });
    });

    await waitFor(() => {
      expect(screen.getByText('Success! Redirecting...')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      },
      { timeout: 1500 }
    );
  });

  it('shows error when validation fails', async () => {
    const code = 'test-code';
    const state = 'test-state';
    window.location.search = `?code=${code}&state=${state}`;

    mockValidateTwitch.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    // First wait for the linking status
    await waitFor(() => {
      expect(
        screen.getByText('Linking your Twitch account...')
      ).toBeInTheDocument();
    });

    // Then wait for the error message
    await waitFor(
      () => {
        expect(
          screen.getByText(
            'Failed to link Twitch account. See console for details.'
          )
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('shows loading indicator when isLoading is true', () => {
    window.location.search = '?code=test-code&state=test-state';

    (useValidateTwitchMutation as unknown as Mock).mockReturnValue([
      mockValidateTwitch,
      { isLoading: true },
    ]);

    mockValidateTwitch.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('handles invalid state gracefully', async () => {
    const code = 'test-code';
    const invalidState = 'invalid-base64';
    window.location.search = `?code=${code}&state=${invalidState}`;

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockValidateTwitch.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <TwitchCallback />
      </MemoryRouter>
    );

    // State decode error is logged, but validation continues
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // The component continues and successfully completes validation
    await waitFor(
      () => {
        expect(screen.getByText('Success! Redirecting...')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    consoleErrorSpy.mockRestore();
  });
});
