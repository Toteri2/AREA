import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Navbar } from './Navbar';

vi.mock('../shared/src/web', async () => {
  return {
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
    logout: vi.fn(() => ({ type: 'auth/logout' })),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { logout, useAppDispatch, useAppSelector } from '../shared/src/web';

describe('Navbar', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
  });

  const renderNavbar = () =>
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

  it('shows Login and Register when not authenticated', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({ auth: { isAuthenticated: false } })
    );

    renderNavbar();

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows authenticated links when logged in', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({ auth: { isAuthenticated: true } })
    );

    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('dispatches logout and redirects to /login', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({ auth: { isAuthenticated: true } })
    );

    renderNavbar();

    fireEvent.click(screen.getByText('Logout'));

    expect(mockDispatch).toHaveBeenCalledWith(logout());
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('always shows brand link', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({ auth: { isAuthenticated: false } })
    );

    renderNavbar();

    expect(screen.getByText('AREA')).toBeInTheDocument();
  });
});
