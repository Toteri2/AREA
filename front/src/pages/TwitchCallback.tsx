import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateTwitchMutation } from '../shared/src/web';

function TwitchCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateTwitch, { isLoading }] = useValidateTwitchMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const validationKey = code ? `twitch-callback:${code}` : null;
    if (validationKey && sessionStorage.getItem(validationKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!state) {
      setStatus('Error: No state found.');
      return;
    }

    try {
      const decodedState = state ? JSON.parse(atob(state)) : {};

      if (decodedState.platform === 'mobile') {
        setStatus('Redirecting to mobile app...');
        // Note: Check what scheme your mobile app expects. Assuming area://auth/twitch
        window.location.href = `area://auth/twitch?code=${code}&state=${state}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
    }

    const linkAccount = async () => {
      setStatus('Linking your Twitch account...');
      if (validationKey) sessionStorage.setItem(validationKey, 'pending');
      try {
        await validateTwitch({ code, state }).unwrap();
        if (validationKey) sessionStorage.setItem(validationKey, 'done');
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } catch (_error) {
        if (validationKey) sessionStorage.removeItem(validationKey);
        setStatus('Failed to link Twitch account. See console for details.');
        console.error(_error);
      }
    };

    linkAccount();
  }, [navigate, validateTwitch]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}

export { TwitchCallback };
export default TwitchCallback;
