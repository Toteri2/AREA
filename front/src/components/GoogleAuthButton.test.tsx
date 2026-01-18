import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleAuthButton } from './GoogleAuthButton';

vi.mock('../shared/src/web', () => ({
  useGoogleAuthUrlQuery: vi.fn(),
}));

import { useGoogleAuthUrlQuery } from '../shared/src/web';

describe('GoogleAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders button with default text', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    render(<GoogleAuthButton />);

    expect(
      screen.getByRole('button', { name: /Continue with Google/i })
    ).toBeInTheDocument();
  });

  it('renders button with custom text', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    render(<GoogleAuthButton buttonText='Sign in with Google' />);

    expect(
      screen.getByRole('button', { name: /Sign in with Google/i })
    ).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<GoogleAuthButton />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when no auth data available', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<GoogleAuthButton />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('redirects to Google auth URL on click', () => {
    const authUrl = 'https://google.com/auth?client_id=123';
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: { url: authUrl },
      isLoading: false,
    });

    render(<GoogleAuthButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(window.location.href).toBe(authUrl);
  });

  it('does not call onError when button is disabled', () => {
    const mockOnError = vi.fn();
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<GoogleAuthButton onError={mockOnError} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('passes mobile parameter to query', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    render(<GoogleAuthButton mobile='true' />);

    expect(useGoogleAuthUrlQuery).toHaveBeenCalledWith({ mobile: 'true' });
  });

  it('renders Google SVG icon', () => {
    (useGoogleAuthUrlQuery as unknown as Mock).mockReturnValue({
      data: { url: 'https://google.com/auth' },
      isLoading: false,
    });

    const { container } = render(<GoogleAuthButton />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
  });
});
