import { Link } from 'react-router-dom';
import { useAppSelector } from '../shared/src/web';

export function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className='dashboard'>
      <h1>Dashboard</h1>
      <div className='welcome-card'>
        <h2>Welcome, {user?.name}!</h2>
        <p>Email: {user?.email}</p>
      </div>
      <div className='dashboard-links'>
        <Link to='/area' className='dashboard-card'>
          <h3>Area (actions - reactions)</h3>
          <p>Manage and link your actions and recations</p>
        </Link>
        <Link to='/profile' className='dashboard-card'>
          <h3>Profile</h3>
          <p>View and edit your profile</p>
        </Link>
      </div>
    </div>
  );
}
