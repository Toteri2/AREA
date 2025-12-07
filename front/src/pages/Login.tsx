import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../shared/src/web';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await login({ email, password }).unwrap();
      navigate('/dashboard');
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      console.error('Failed to login:', err);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <h1>Login</h1>
        {errorMessage && <div className='error-message'>{errorMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type='submit' className='btn-primary' disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className='auth-link'>
          Don't have an account? <Link to='/register'>Register</Link>
        </p>
      </div>
    </div>
  );
}
