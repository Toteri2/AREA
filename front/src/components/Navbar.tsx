import { Link } from 'react-router-dom';
import { useAppSelector } from '../shared/src/web';
import { ApkDownloadButton } from './ApkDownloadButton';

export function Navbar() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <nav className='navbar'>
      <div className='navbar-brand'>
        <Link to='/'>AREA</Link>
      </div>
      <div className='navbar-menu'>
        {isAuthenticated ? (
          <>
            <Link to='/dashboard'>Dashboard</Link>
            <Link to='/area'>Area</Link>
            <Link to='/profile'>Profile</Link>
            <ApkDownloadButton />
          </>
        ) : (
          <>
            <Link to='/login'>Login</Link>
            <Link to='/register'>Register</Link>
            <ApkDownloadButton />
          </>
        )}
      </div>
    </nav>
  );
}
