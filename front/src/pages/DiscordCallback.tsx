import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateDiscordMutation } from '../shared/src/web';

function DiscordCallback() {
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

    const parseState = (stateParam: string | null) => {
      if (!stateParam) return {};
      try {
        return JSON.parse(atob(stateParam));
      } catch {
        try {
          return JSON.parse(stateParam);
        } catch {
          console.warn('Could not parse state parameter');
          return {};
        }
      }
    };

    const decodedState = parseState(state);
    if (decodedState.platform === 'mobile') {
      setStatus('Redirecting to mobile app...');
      window.location.href = `area://auth/discord?code=${code}`;
      return;
    }

    // Web flow: Link Discord account
    const linkAccount = async () => {
      setStatus('Linking your Discord account...');
      try {
        await validateDiscord({ code, state: state || '' }).unwrap();
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

export { DiscordCallback };
export default DiscordCallback;
