import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscordCallback } from './DiscordCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateDiscordMutation: vi.fn(),
}));

import { useValidateDiscordMutation } from '../shared/src/web';

describe('DiscordCallback', () => {
  const mockValidateDiscord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
    (useValidateDiscordMutation as unknown as Mock).mockReturnValue([
      mockValidateDiscord,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'discord-code-123';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/discord?code=${code}`);
  });

  it('validates Discord auth and navigates to profile on success', async () => {
    const code = 'discord-code-456';
    const state = 'test-state';
    window.location.search = `?code=${code}&state=${state}`;

    mockValidateDiscord.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your Discord account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateDiscord).toHaveBeenCalledWith({ code, state });
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
    const code = 'discord-code-789';
    window.location.search = `?code=${code}`;

    mockValidateDiscord.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to link Discord account. Please try again.')
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading is true', () => {
    window.location.search = '?code=test-code';

    (useValidateDiscordMutation as unknown as Mock).mockReturnValue([
      mockValidateDiscord,
      { isLoading: true },
    ]);

    mockValidateDiscord.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('handles invalid state gracefully', async () => {
    const code = 'discord-code-999';
    const invalidState = 'invalid-base64';
    window.location.search = `?code=${code}&state=${invalidState}`;

    mockValidateDiscord.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateDiscord).toHaveBeenCalledWith({
        code,
        state: invalidState,
      });
    });
  });

  it('uses empty string for state when state is not provided', async () => {
    const code = 'discord-code-000';
    window.location.search = `?code=${code}`;

    mockValidateDiscord.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <DiscordCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateDiscord).toHaveBeenCalledWith({
        code,
        state: '',
      });
    });
  });
});
