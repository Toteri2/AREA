import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateDiscordMutation } from '../shared/src/web';

export function DiscordCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateDiscord, { isLoading }] = useValidateDiscordMutation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setStatus('Error: No authorization code found.');
      return;
    }

    try {
      const decodedState = state ? JSON.parse(atob(state)) : {};
      if (decodedState.platform === 'mobile') {
        setStatus('Redirecting to mobile app...');
        window.location.href = `area://auth/discord?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
    }

    // Web flow: Link Discord account
    const linkAccount = async () => {
      setStatus('Linking your Discord account...');
      try {
        await validateDiscord({ code }).unwrap();
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } catch (error) {
        console.error('Discord validation error:', error);
        setStatus('Failed to link Discord account. Please try again.');
      }
    };

    linkAccount();
  }, [navigate, validateDiscord]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}
