import { type FormEvent, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useRegisterMutation } from '../shared/src/web';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requirements = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    {
      label: 'At least one uppercase letter',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: 'At least one lowercase letter',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    { label: 'At least one number', test: (pwd: string) => /[0-9]/.test(pwd) },
    {
      label: 'At least one special character',
      test: (pwd: string) => /[\W_]/.test(pwd),
    },
    {
      label: 'Must not include name',
      test: (pwd: string) => {
        if (!name) return true;
        const regex = new RegExp(name, 'i');
        return !regex.test(pwd);
      },
    },
  ];

  const passwordStrength = requirements.reduce(
    (score, req) => score + (req.test(password) ? 1 : 0),
    0
  );

  const getStrengthText = (strength: number) => {
    if (strength === 0) return 'No password';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    if (strength <= 5) return 'Strong';
    return 'Very Strong';
  };

  const isEmailValid = (value: string) =>
    value.length <= 254 &&
    /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,63}$/.test(
      value
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEmailValid(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (passwordStrength < 6) {
      setErrorMessage('Password must satisfied the 6 criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const data = await register({ name, email, password }).unwrap();
      if (data.token) {
        navigate('/dashboard');
      } else {
        setErrorMessage('Failed to get authentication token.');
      }
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'An unexpected error occurred.';
      setErrorMessage(message);
      console.error('Failed to register:', err);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <h1>Register</h1>
        {errorMessage && <div className='error-message'>{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='name'>Name</label>
            <input
              type='text'
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingRight: '2rem' }}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2rem' }}
              />
              <button
                type='button'
                aria-label='Show Password'
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '52%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  background: 'none',
                }}
              >
                {showPassword ? (
                  <FaEyeSlash color='white' />
                ) : (
                  <FaEye color='white' />
                )}
              </button>
            </div>

            {/* Barre de progression de la force du mot de passe */}
            {password && (
              <div className='password-strength-bar'>
                <div className='password-strength-bar-label'>
                  <span>Password Strength:</span>
                  <span
                    className='strength-text'
                    data-strength={passwordStrength}
                  >
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className='password-strength-bar-track'>
                  <div
                    className='password-strength-bar-fill'
                    data-strength={passwordStrength}
                  />
                </div>
              </div>
            )}

            {/* Liste des exigences améliorée */}
            <div className='password-requirements'>
              <p>Password requirements for your security:</p>
              <ul>
                {requirements.map((req) => (
                  <li
                    key={req.label}
                    style={{ color: req.test(password) ? 'green' : 'red' }}
                  >
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='form-group'>
            <label htmlFor='confirmPassword'>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirmPassword'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '2rem' }}
              />
              <button
                type='button'
                aria-label='Show Password'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  background: 'none',
                }}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash color='white' />
                ) : (
                  <FaEye color='white' />
                )}
              </button>
            </div>
          </div>

          <button type='submit' className='btn-primary' disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className='divider'>
          <span>OR</span>
        </div>

        <GoogleAuthButton onError={setErrorMessage} redirectTo='/dashboard' />

        <p className='auth-link'>
          Already have an account? <Link to='/login'>Login</Link>
        </p>
      </div>
    </div>
  );
}

export { Register };
export default Register;
