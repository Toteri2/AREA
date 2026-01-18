import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

vi.mock('../shared/src/web', () => ({
  useAppSelector: vi.fn(),
}));

import { useAppSelector } from '../shared/src/web';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'john@test.com' },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays welcome message with user name', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Alice Smith', email: 'alice@test.com' },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome, Alice Smith!')).toBeInTheDocument();
    expect(screen.getByText('Email: alice@test.com')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Bob', email: 'bob@test.com' },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const areaLink = screen.getByRole('link', { name: /Area/i });
    expect(areaLink).toBeInTheDocument();
    expect(areaLink).toHaveAttribute('href', '/area');

    const profileLink = screen.getByRole('link', { name: /Profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('displays area card description', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Test', email: 'test@test.com' },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Area (actions - reactions)')).toBeInTheDocument();
    expect(
      screen.getByText('Manage and link your actions and reactions')
    ).toBeInTheDocument();
  });

  it('displays profile card description', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Test', email: 'test@test.com' },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('View and edit your profile')).toBeInTheDocument();
  });

  it('handles undefined user gracefully', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: undefined,
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome, !')).toBeInTheDocument();
    expect(screen.getByText('Email:')).toBeInTheDocument();
  });
});
