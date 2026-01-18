import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from './Login';

const navigateMock = vi.fn();
const loginMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../shared/src/web', () => ({
  useLoginMutation: () => [loginMock, { isLoading: false }],
  useGoogleAuthUrlQuery: () => ({ data: null, isLoading: false }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits credentials and navigates on success', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows API error message on failed login', async () => {
    loginMock.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          data: { message: 'Invalid credentials' },
        }),
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows fallback error message when API message is missing', async () => {
    loginMock.mockReturnValue({
      unwrap: () => Promise.reject({}),
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });
  });
});
