import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MicrosoftCallback } from './MicrosoftCallback';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../shared/src/web', () => ({
  useValidateMicrosoftMutation: vi.fn(),
}));

import { useValidateMicrosoftMutation } from '../shared/src/web';

describe('MicrosoftCallback', () => {
  const mockValidateMicrosoft = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        search: '',
      },
      writable: true,
    });
    (useValidateMicrosoftMutation as unknown as Mock).mockReturnValue([
      mockValidateMicrosoft,
      { isLoading: false },
    ]);
  });

  it('shows error when no code is provided', () => {
    window.location.search = '';

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Error: No authorization code found.')
    ).toBeInTheDocument();
  });

  it('redirects to mobile app for mobile platform', () => {
    const code = 'ms-code-123';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toBe(`area://auth/microsoft?code=${code}`);
  });

  it('handles mobile deep link with correct URL scheme', () => {
    const code = 'mobile-ms-code';
    const state = btoa(JSON.stringify({ platform: 'mobile', tenantId: 'xyz789' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Redirecting to mobile app...')
    ).toBeInTheDocument();
    expect(window.location.href).toContain('area://auth/microsoft');
    expect(window.location.href).toContain(`code=${code}`);
  });

  it('does not call validateMicrosoft when redirecting to mobile', () => {
    const code = 'ms-mobile-code';
    const state = btoa(JSON.stringify({ platform: 'mobile' }));
    window.location.search = `?code=${code}&state=${state}`;

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(mockValidateMicrosoft).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('validates Microsoft auth and navigates to profile on success', async () => {
    const code = 'ms-code-456';
    window.location.search = `?code=${code}`;

    mockValidateMicrosoft.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Linking your Microsoft account...')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockValidateMicrosoft).toHaveBeenCalledWith({ code });
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
    const code = 'ms-code-789';
    window.location.search = `?code=${code}`;

    mockValidateMicrosoft.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Validation failed')),
    });

    render(
      <MemoryRouter>
        <MicrosoftCallback />
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

    (useValidateMicrosoftMutation as unknown as Mock).mockReturnValue([
      mockValidateMicrosoft,
      { isLoading: true },
    ]);

    mockValidateMicrosoft.mockReturnValue({
      unwrap: vi.fn().mockImplementation(() => new Promise(() => {})),
    });

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    expect(screen.getByText('Validating...')).toBeInTheDocument();
  });

  it('handles invalid state gracefully', async () => {
    const code = 'ms-code-999';
    const invalidState = 'invalid-base64';
    window.location.search = `?code=${code}&state=${invalidState}`;

    mockValidateMicrosoft.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({}),
    });

    render(
      <MemoryRouter>
        <MicrosoftCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockValidateMicrosoft).toHaveBeenCalledWith({ code });
    });
  });
});
