import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NoNavbarLayout from './NoNavbarLayout';

describe('NoNavbarLayout', () => {
  it('renders outlet without navbar', () => {
    render(
      <MemoryRouter>
        <NoNavbarLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole('main')).toHaveClass('main-content');
  });

  it('does not render navbar', () => {
    const { container } = render(
      <MemoryRouter>
        <NoNavbarLayout />
      </MemoryRouter>
    );

    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });
});
