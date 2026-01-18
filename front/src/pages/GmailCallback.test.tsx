import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GmailCallback } from './GmailCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateGmailMutation: vi.fn(),
}));

import { useValidateGmailMutation } from '../shared/src/web';

describe('GmailCallback', () => {
  const mockValidateGmail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
    (useValidateGmailMutation as unknown as Mock).mockReturnValue([
      mockValidateGmail,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'gmail-code-123';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/gmail?code=${code}`);
  });

  it('validates Gmail auth and navigates to profile on success', async () => {
    const code = 'gmail-code-456';
    window.location.search = `?code=${code}`;

    mockValidateGmail.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your Gmail account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateGmail).toHaveBeenCalledWith({ code });
    });

    await waitFor(() => {
      expect(screen.getByText('Success! Redirecting...')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      },
      { timeout: 2000 }
    );
  });

  it('redirects even when validation fails (graceful error handling)', async () => {
    const code = 'gmail-code-789';
    window.location.search = `?code=${code}`;

    mockValidateGmail.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Linking complete. Redirecting...')
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      },
      { timeout: 2000 }
    );
  });

  it('shows loading indicator when isLoading is true', () => {
    window.location.search = '?code=test-code';

    (useValidateGmailMutation as unknown as Mock).mockReturnValue([
      mockValidateGmail,
      { isLoading: true },
    ]);

    mockValidateGmail.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('handles invalid state gracefully', async () => {
    const code = 'gmail-code-999';
    const invalidState = 'invalid-base64';
    window.location.search = `?code=${code}&state=${invalidState}`;

    mockValidateGmail.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <GmailCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateGmail).toHaveBeenCalledWith({ code });
    });
  });
});
