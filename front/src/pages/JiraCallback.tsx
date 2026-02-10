import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateJiraMutation } from '../shared/src/web';

function JiraCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateJira, { isLoading }] = useValidateJiraMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const validationKey = code ? `jira-callback:${code}` : null;
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

    try {
      const decodedState = state ? JSON.parse(atob(state)) : {};

      if (decodedState.platform === 'mobile') {
        setStatus('Redirecting to mobile app...');
        window.location.href = `area://auth/jira?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
    }

    const linkAccount = async () => {
      setStatus('Linking your Jira account...');
      if (validationKey) sessionStorage.setItem(validationKey, 'pending');
      try {
        await validateJira({ code }).unwrap();
        if (validationKey) sessionStorage.setItem(validationKey, 'done');
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } catch (_error) {
        if (validationKey) sessionStorage.removeItem(validationKey);
        setStatus('Failed to link Jira account. See console for details.');
        console.error(_error);
      }
    };

    linkAccount();
  }, [navigate, validateJira]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}

export { JiraCallback };
export default JiraCallback;
