import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Register } from './Register';

vi.mock('../shared/src/web', async () => ({
  useRegisterMutation: vi.fn(),
  useGoogleAuthUrlQuery: vi.fn(() => ({ data: null, isLoading: false })),
}));

import { useRegisterMutation } from '../shared/src/web';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Component', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRegisterMutation as unknown as Mock).mockReturnValue([
      mockRegister,
      { isLoading: false },
    ]);
  });

  const renderRegister = () =>
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

  it('renders all input fields and submit button', () => {
    renderRegister();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Register' })
    ).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alice@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Abcd123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Xyz123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    const error = await screen.findByText('Passwords do not match.');
    expect(error).toBeInTheDocument();

    expect(mockRegister).not.toHaveBeenCalled();
  });



  it('calls register mutation and navigates on success', async () => {
    mockRegister.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ token: 'abc123' }),
    });

    renderRegister();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alice@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Abcd123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Abcd123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@test.com',
        password: 'Abcd123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows API error message when registration fails', async () => {
    const error = { data: { message: 'Email already exists' } };
    mockRegister.mockReturnValue({ unwrap: vi.fn().mockRejectedValue(error) });

    renderRegister();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alice@test.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Abcd123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Abcd123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('disables submit button when isLoading is true', () => {
    (useRegisterMutation as unknown as Mock).mockReturnValue([
      mockRegister,
      { isLoading: true },
    ]);
    renderRegister();
    const button = screen.getByRole('button', { name: 'Registering...' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Registering...');
  });

  it('shows password requirements when typing', async () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'ab' } });

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('At least one uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least one lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('At least one number')).toBeInTheDocument();
    expect(screen.getByText('At least one special character')).toBeInTheDocument();
  });

  it('validates password meets all requirements', async () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    await screen.findByText('At least 8 characters');
    
    fireEvent.change(passwordInput, { target: { value: 'Strong123!' } });
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    
    const toggleButtons = screen.getAllByRole('button');
    const eyeButton = toggleButtons.find(btn => btn !== screen.getByRole('button', { name: /Register/i }));
    
    if (eyeButton) {
      fireEvent.click(eyeButton);
      expect(passwordInput.type).toBe('text');
      
      fireEvent.click(eyeButton);
      expect(passwordInput.type).toBe('password');
    }
  });

  it('handles error when API returns non-standard error', async () => {
    const error = { error: 'Unknown error' };
    mockRegister.mockReturnValue({ unwrap: vi.fn().mockRejectedValue(error) });

    renderRegister();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bob@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Pass123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('An unexpected error occurred.')).toBeInTheDocument();
  });
});

