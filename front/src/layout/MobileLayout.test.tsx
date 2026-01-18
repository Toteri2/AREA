import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

  it('renders child routes correctly', () => {
    const TestComponent = () => <div>Mobile Child Content</div>;

    render(
      <MemoryRouter initialEntries={['/mobile/test']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/test' element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Mobile Child Content')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('mobile-content');
  });

  it('has correct semantic structure', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('mobile-content');
  });

  it('renders without any navigation elements', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>
    );

    expect(container.querySelector('nav')).not.toBeInTheDocument();
    expect(container.querySelector('header')).not.toBeInTheDocument();
    expect(container.querySelector('footer')).not.toBeInTheDocument();
  });

  it('maintains accessibility with proper main landmark', () => {
    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
