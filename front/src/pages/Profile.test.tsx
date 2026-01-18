import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from './Profile';

vi.mock('../shared/src/web', async () => {
  return {
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
    useGetGithubAuthUrlQuery: vi.fn(),
    useGetMicrosoftAuthUrlQuery: vi.fn(),
    useGetGmailAuthUrlQuery: vi.fn(),
    useGetDiscordAuthUrlQuery: vi.fn(),
    useGetJiraAuthUrlQuery: vi.fn(),
    useGetTwitchAuthUrlQuery: vi.fn(),
    useGetServicesQuery: vi.fn(),
    useConnectionQuery: vi.fn(),
  };
});

import {
  useAppDispatch,
  useAppSelector,
  useConnectionQuery,
  useGetDiscordAuthUrlQuery,
  useGetGithubAuthUrlQuery,
  useGetGmailAuthUrlQuery,
  useGetJiraAuthUrlQuery,
  useGetMicrosoftAuthUrlQuery,
  useGetServicesQuery,
  useGetTwitchAuthUrlQuery,
} from '../shared/src/web';

describe('Profile component', () => {
  const mockUser = { id: '123', name: 'Alice', email: 'alice@test.com' };
  const mockRefetch = vi.fn();
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);

    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({ auth: { user: mockUser } })
    );

    (useGetServicesQuery as unknown as Mock).mockReturnValue({
      data: {
        server: {
          services: [
            { name: 'github', actions: [], reactions: [] },
            { name: 'microsoft', actions: [], reactions: [] },
          ],
        },
      },
    });

    (useGetGithubAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useGetMicrosoftAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useGetGmailAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useGetDiscordAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useGetJiraAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useGetTwitchAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: mockRefetch,
    });
    (useConnectionQuery as unknown as Mock).mockReturnValue({
      isLoading: false,
      data: { connected: false },
    });
  });

  const renderProfile = () =>
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

  it('renders user info correctly', () => {
    renderProfile();

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText(/Name:/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/Email:/)).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  it('renders GitHub and Microsoft buttons when services are not linked', () => {
    renderProfile();

    expect(screen.getByText('Link GitHub Account')).toBeInTheDocument();
    expect(screen.getByText('Link Microsoft Account')).toBeInTheDocument();
  });

  it('calls GitHub refetch and redirects on button click', async () => {
    const url = 'https://github.com/login/oauth/authorize';
    mockRefetch.mockResolvedValue({ data: { url } });

    renderProfile();

    const githubButton = screen.getByText('Link GitHub Account');

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    await fireEvent.click(githubButton);

    expect(mockRefetch).toHaveBeenCalled();
    expect(window.location.href).toBe(url);
  });

  it('calls Microsoft refetch and redirects on button click', async () => {
    const url = 'https://login.microsoftonline.com/';
    mockRefetch.mockResolvedValue({ data: { url } });

    renderProfile();

    const msButton = screen.getByText('Link Microsoft Account');

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    await fireEvent.click(msButton);

    expect(mockRefetch).toHaveBeenCalled();
    expect(window.location.href).toBe(url);
  });

  it('shows loading spinner when GitHub API is loading', () => {
    (useConnectionQuery as unknown as Mock).mockReturnValue({
      isLoading: true,
      data: { connected: false },
    });

    renderProfile();

    const loadingElements = screen.getAllByText('Loading...');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows success message when GitHub account is linked', () => {
    (useConnectionQuery as unknown as Mock).mockImplementation(
      (params: { provider?: string }) => {
        if (params?.provider === 'github') {
          return {
            isLoading: false,
            data: { connected: true },
          };
        }
        return {
          isLoading: false,
          data: { connected: false },
        };
      }
    );

    renderProfile();

    expect(screen.getByText('✓ GitHub Account Linked')).toBeInTheDocument();
    expect(screen.getByText('Change Account')).toBeInTheDocument();
  });

  it('shows success message when Microsoft account is linked', () => {
    (useConnectionQuery as unknown as Mock).mockImplementation(
      (params: { provider?: string }) => {
        if (params?.provider === 'microsoft') {
          return {
            isLoading: false,
            data: { connected: true },
          };
        }
        return {
          isLoading: false,
          data: { connected: false },
        };
      }
    );

    renderProfile();

    expect(screen.getByText('✓ Microsoft Account Linked')).toBeInTheDocument();
    expect(screen.getByText('Change Account')).toBeInTheDocument();
  });

  it('shows all services (Gmail, Discord, Jira, Twitch) when available', () => {
    (useGetServicesQuery as unknown as Mock).mockReturnValue({
      data: {
        server: {
          services: [
            { name: 'gmail', actions: [], reactions: [] },
            { name: 'discord', actions: [], reactions: [] },
            { name: 'jira', actions: [], reactions: [] },
            { name: 'twitch', actions: [], reactions: [] },
          ],
        },
      },
    });

    renderProfile();

    expect(screen.getByText('Link Gmail Account')).toBeInTheDocument();
    expect(screen.getByText('Link Discord Account')).toBeInTheDocument();
    expect(screen.getByText('Link Jira Account')).toBeInTheDocument();
    expect(screen.getByText('Link Twitch Account')).toBeInTheDocument();
  });

  it('handles OAuth error gracefully', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    (useGetGithubAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: vi.fn().mockResolvedValue({ error: 'API Error' }),
    });

    renderProfile();

    const githubButton = screen.getByText('Link GitHub Account');
    await fireEvent.click(githubButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Unable to connect to GitHub');
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it('handles unexpected error in OAuth redirect', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    (useGetGithubAuthUrlQuery as unknown as Mock).mockReturnValue({
      refetch: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    renderProfile();

    const githubButton = screen.getByText('Link GitHub Account');
    await fireEvent.click(githubButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Unexpected error occurred');
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});
