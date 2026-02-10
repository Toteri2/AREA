import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JiraCallback } from './JiraCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateJiraMutation: vi.fn(),
}));

import { useValidateJiraMutation } from '../shared/src/web';

describe('JiraCallback', () => {
  const mockValidateJira = vi.fn();

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
    (useValidateJiraMutation as unknown as Mock).mockReturnValue([
      mockValidateJira,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
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
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/jira?code=${code}`);
  });

  it('handles mobile deep link with correct URL scheme', () => {
    const code = 'mobile-jira-code';
    const state = btoa(JSON.stringify({ platform: 'mobile', cloudId: 'cloud123' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toContain('area://auth/jira');
    expect(window.location.href).toContain(`code=${code}`);
  });

  it('does not call validateJira when redirecting to mobile', () => {
    const code = 'jira-mobile-code';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
    );

    expect(mockValidateJira).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('validates Jira auth and navigates to profile on success', async () => {
    const code = 'test-code';
    window.location.search = `?code=${code}`;

    mockValidateJira.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your Jira account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateJira).toHaveBeenCalledWith({ code });
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
    window.location.search = `?code=${code}`;

    mockValidateJira.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <MemoryRouter>
        <JiraCallback />
      </MemoryRouter>
    );

    // First wait for the linking status
    await waitFor(() => {
      expect(
        screen.getByText('Linking your Jira account...')
      ).toBeInTheDocument();
    });

    // Then wait for the error message
    await waitFor(
      () => {
        expect(
          screen.getByText(
            'Failed to link Jira account. See console for details.'
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
    window.location.search = '?code=test-code';

    (useValidateJiraMutation as unknown as Mock).mockReturnValue([
      mockValidateJira,
      { isLoading: true },
    ]);

    mockValidateJira.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <JiraCallback />
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

    mockValidateJira.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <JiraCallback />
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
