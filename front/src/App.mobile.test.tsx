import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MobileLayout from './layout/MobileLayout';
import NoNavbarLayout from './layout/NoNavbarLayout';

// Simple test component
const TestPage = () => <div data-testid='test-page'>Test Content</div>;

describe('Mobile Layout Integration', () => {
  it('MobileLayout renders without navbar', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/mobile/test']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/test' element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should have mobile-content main
    expect(container.querySelector('main.mobile-content')).toBeInTheDocument();

    // Should NOT have navbar
    expect(container.querySelector('nav')).not.toBeInTheDocument();

    // Should render child content
    expect(container.querySelector('[data-testid="test-page"]')).toBeInTheDocument();
  });

  it('NoNavbarLayout renders without navbar but also without mobile class', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<NoNavbarLayout />}>
            <Route path='/test' element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should NOT have navbar
    expect(container.querySelector('nav')).not.toBeInTheDocument();

    // Should NOT have mobile-content class (different from MobileLayout)
    expect(container.querySelector('main.mobile-content')).not.toBeInTheDocument();
  });

  it('MobileLayout is distinct from NoNavbarLayout', () => {
    const { container: mobileContainer } = render(
      <MemoryRouter initialEntries={['/mobile/test']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/test' element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const { container: noNavbarContainer } = render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<NoNavbarLayout />}>
            <Route path='/test' element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // MobileLayout has mobile-content class
    expect(
      mobileContainer.querySelector('main.mobile-content')
    ).toBeInTheDocument();

    // NoNavbarLayout does NOT have mobile-content class
    expect(
      noNavbarContainer.querySelector('main.mobile-content')
    ).not.toBeInTheDocument();

    // Neither should have navbar
    expect(mobileContainer.querySelector('nav')).not.toBeInTheDocument();
    expect(noNavbarContainer.querySelector('nav')).not.toBeInTheDocument();
  });

  it('MobileLayout is optimized for mobile with minimal structure', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/mobile/test']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/test' element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Should only have main element
    const mains = container.querySelectorAll('main');
    expect(mains.length).toBe(1);

    // Should not have navigation overhead
    expect(container.querySelector('nav')).not.toBeInTheDocument();
    expect(container.querySelector('header')).not.toBeInTheDocument();
    expect(container.querySelector('footer')).not.toBeInTheDocument();
  });

  it('multiple routes can be rendered under MobileLayout', () => {
    const Page1 = () => <div data-testid='page1'>Page 1</div>;
    const Page2 = () => <div data-testid='page2'>Page 2</div>;

    const { container: container1, getByTestId: getByTestId1 } = render(
      <MemoryRouter initialEntries={['/mobile/page1']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/page1' element={<Page1 />} />
            <Route path='/mobile/page2' element={<Page2 />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const { container: container2, getByTestId: getByTestId2 } = render(
      <MemoryRouter initialEntries={['/mobile/page2']}>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route path='/mobile/page1' element={<Page1 />} />
            <Route path='/mobile/page2' element={<Page2 />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Both should use MobileLayout
    expect(container1.querySelector('main.mobile-content')).toBeInTheDocument();
    expect(container2.querySelector('main.mobile-content')).toBeInTheDocument();

    // Each renders correct page
    expect(getByTestId1('page1')).toBeInTheDocument();
    expect(getByTestId2('page2')).toBeInTheDocument();
  });
});
