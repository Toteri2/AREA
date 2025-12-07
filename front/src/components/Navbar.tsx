import { Link, useNavigate } from 'react-router-dom';
import { logout, useAppDispatch, useAppSelector } from '../shared/src/web';

export function Navbar() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
            <Link to='/github'>GitHub</Link>
            <Link to='/microsoft'>Microsoft</Link>
            <Link to='/Reactions'>Reactions</Link>
            <Link to='/profile'>Profile</Link>
            <button type='button' onClick={handleLogout} className='btn-logout'>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to='/login'>Login</Link>
            <Link to='/register'>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
