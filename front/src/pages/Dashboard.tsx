import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className='dashboard'>
      <h1>Dashboard</h1>
      <div className='welcome-card'>
        <h2>Welcome, {user?.name}!</h2>
        <p>Email: {user?.email}</p>
      </div>
      <div className='dashboard-links'>
        <Link to='/github' className='dashboard-card'>
          <h3>GitHub Integration</h3>
          <p>Manage your repositories and webhooks</p>
        </Link>
        <Link to='/profile' className='dashboard-card'>
          <h3>Profile</h3>
          <p>View and edit your profile</p>
        </Link>
      </div>
    </div>
  );
}
