import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubCallback } from './GitHubCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateGithubMutation: vi.fn(),
}));

import { useValidateGithubMutation } from '../shared/src/web';

describe('GitHubCallback', () => {
  const mockValidateGithub = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
    (useValidateGithubMutation as unknown as Mock).mockReturnValue([
      mockValidateGithub,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'gh-code-123';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/github?code=${code}`);
  });

  it('handles mobile deep link with correct URL scheme', () => {
    const code = 'mobile-gh-code';
    const state = btoa(JSON.stringify({ platform: 'mobile', userId: '456' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toContain('area://auth/github');
    expect(window.location.href).toContain(`code=${code}`);
  });

  it('does not call validateGithub when redirecting to mobile', () => {
    const code = 'gh-code-789';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(mockValidateGithub).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles web platform correctly', async () => {
    const code = 'gh-code-web';
    const state = btoa(JSON.stringify({ platform: 'web' }));
    window.location.search = `?code=${code}&state=${state}`;

    mockValidateGithub.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateGithub).toHaveBeenCalledWith({ code });
    });

    expect(window.location.href).not.toContain('area://');
  });

  it('validates GitHub auth and navigates to profile on success', async () => {
    const code = 'gh-code-456';
    window.location.search = `?code=${code}`;

    mockValidateGithub.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your GitHub account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateGithub).toHaveBeenCalledWith({ code });
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
    const code = 'gh-code-789';
    window.location.search = `?code=${code}`;

    mockValidateGithub.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to link GitHub account. See console for details.'
        )
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading is true', () => {
    window.location.search = '?code=test-code';

    (useValidateGithubMutation as unknown as Mock).mockReturnValue([
      mockValidateGithub,
      { isLoading: true },
    ]);

    mockValidateGithub.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('handles invalid state gracefully', async () => {
    const code = 'gh-code-999';
    const invalidState = 'invalid-base64';
    window.location.search = `?code=${code}&state=${invalidState}`;

    mockValidateGithub.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <GitHubCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateGithub).toHaveBeenCalledWith({ code });
    });
  });
});
