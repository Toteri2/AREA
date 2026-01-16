import { Outlet } from 'react-router-dom';

const MobileLayout = () => {
  return (
    <main className='mobile-content'>
      <Outlet />
    </main>
  );
};

export default MobileLayout;
