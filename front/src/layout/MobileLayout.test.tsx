import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MobileLayout from './MobileLayout';

describe('MobileLayout', () => {
  it('renders outlet without navbar', () => {
    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole('main')).toHaveClass('mobile-content');
  });

  it('does not render navbar', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>
    );

    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });
});
