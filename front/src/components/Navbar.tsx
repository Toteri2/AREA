import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../shared/src/features/authSlice';
import { useAppDispatch, useAppSelector } from '../shared/src/web';
import { ApkDownloadButton } from './ApkDownloadButton';

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

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
            <button type='button' onClick={handleLogout}>Logout</button>
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
