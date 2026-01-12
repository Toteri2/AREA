import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuthValidateMutation } from '../shared/src/web';

export function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [googleAuthValidate, { isLoading }] = useGoogleAuthValidateMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    console.log('Google Callback params:', { code, state });

    if (!code) {
      setStatus('Error: No authorization code found.');
      return;
    }

    try {
      const decodedState = state ? JSON.parse(atob(state)) : {};

      // IF MOBILE: Kick them back to the app
      if (decodedState.platform === 'mobile') {
        setStatus('Redirecting to mobile app...');
        window.location.href = `area://auth/google?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
    }

    // IF WEB (or if state is invalid): Continue with normal web login...
    const linkAccount = async () => {
      setStatus('Linking your Google account...');
      try {
        const data = await googleAuthValidate({
          code,
          ...(state && { state }),
        }).unwrap();

        if (data.token) {
          setStatus('Success! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          setStatus('Failed to get authentication token.');
        }
      } catch (error) {
        console.error('Google validation error:', error);
        setStatus('Failed to link Google account. See console for details.');
      }
    };

    linkAccount();
  }, [navigate, googleAuthValidate]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}
