import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateTwitchMutation } from '../shared/src/web';

export function TwitchCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateTwitch, { isLoading }] = useValidateTwitchMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

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
      try {
        await validateTwitch({ code, state }).unwrap();
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } catch (_error) {
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
