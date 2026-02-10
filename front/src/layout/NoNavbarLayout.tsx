import { Outlet } from 'react-router-dom';

const NoNavbarLayout = () => {
  return (
    <main className='main-content'>
      <Outlet />
    </main>
  );
};

export default NoNavbarLayout;
