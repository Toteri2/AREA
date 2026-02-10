import { Outlet } from 'react-router-dom';
import { Navbar } from '../components';

const AppLayout = () => {
  return (
    <div className='app'>
      <Navbar />
      <main className='main-content'>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
