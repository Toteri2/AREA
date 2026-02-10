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
  });

  it('renders dashboard structure suitable for mobile', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Mobile User', email: 'mobile@test.com' },
        },
      })
    );

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const dashboard = container.querySelector('.dashboard');
    expect(dashboard).toBeInTheDocument();

    const dashboardLinks = container.querySelector('.dashboard-links');
    expect(dashboardLinks).toBeInTheDocument();
  });

  it('all links are accessible for mobile navigation', () => {
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

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach((link) => {
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href');
    });
  });

  it('displays welcome card with user information', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'john@test.com' },
        },
      })
    );

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const welcomeCard = container.querySelector('.welcome-card');
    expect(welcomeCard).toBeInTheDocument();
    expect(welcomeCard).toHaveTextContent('Welcome, John Doe!');
  });

  it('renders dashboard cards with proper structure', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: { id: '1', name: 'Test', email: 'test@test.com' },
        },
      })
    );

    const { container } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const dashboardCards = container.querySelectorAll('.dashboard-card');
    expect(dashboardCards.length).toBe(2);

    dashboardCards.forEach((card) => {
      expect(card.tagName).toBe('A');
      expect(card).toHaveAttribute('href');
    });
  });

  it('renders correctly with long user names for mobile display', () => {
    (useAppSelector as unknown as Mock).mockImplementation((selector) =>
      selector({
        auth: {
          user: {
            id: '1',
            name: 'Very Long User Name That Could Overflow',
            email: 'long@test.com',
          },
        },
      })
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Welcome, Very Long User Name That Could Overflow!')
    ).toBeInTheDocument();
  });
});
