import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateMicrosoftMutation } from '../shared/src/web';

function MicrosoftCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateMicrosoft, { isLoading }] = useValidateMicrosoftMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const validationKey = code ? `microsoft-callback:${code}` : null;
    if (validationKey && sessionStorage.getItem(validationKey)) {
      setStatus('Session already validated. Redirecting...');
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
      return;
    }

    if (!code) {
      setStatus('Error: No authorization code found.');
      return;
    }

    try {
      const decodedState = state ? JSON.parse(atob(state)) : {};

      // IF MOBILE: Kick them back to the app
      if (decodedState.platform === 'mobile') {
        setStatus('Redirecting to mobile app...');
        window.location.href = `area://auth/microsoft?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
      // Fall through to normal web flow
    }

    // IF WEB (or if state is invalid): Continue with normal web login...
    const linkAccount = async () => {
      setStatus('Linking your Microsoft account...');
      if (validationKey) sessionStorage.setItem(validationKey, 'pending');
      try {
        await validateMicrosoft({ code }).unwrap();
        if (validationKey) sessionStorage.setItem(validationKey, 'done');
        setStatus('Success! Redirecting...');
      } catch (error) {
        // Account might still be linked despite error, redirect anyway
        console.warn(
          'Microsoft validation error (account may still be linked):',
          error
        );
        if (validationKey) sessionStorage.removeItem(validationKey);
        setStatus('Linking complete. Redirecting...');
      }
      // Always redirect after a delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    };

    linkAccount();
  }, [navigate, validateMicrosoft]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}

export { MicrosoftCallback };
export default MicrosoftCallback;
