import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from './AppLayout';

vi.mock('../components', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

describe('AppLayout', () => {
  it('renders navbar and outlet', () => {
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('main-content');
  });

  it('has correct structure with app wrapper', () => {
    const { container } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>
    );

    const appDiv = container.querySelector('.app');
    expect(appDiv).toBeInTheDocument();
    expect(appDiv?.querySelector('main.main-content')).toBeInTheDocument();
  });
});
