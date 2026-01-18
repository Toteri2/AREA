import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidateGithubMutation } from '../shared/src/web';

function GitHubCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating session...');
  const [validateGithub, { isLoading }] = useValidateGithubMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const validationKey = code ? `github-callback:${code}` : null;
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
        window.location.href = `area://auth/github?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
      // Fall through to normal web flow
    }

    // IF WEB (or if state is invalid): Continue with normal web login...
    const linkAccount = async () => {
      setStatus('Linking your GitHub account...');
      if (validationKey) sessionStorage.setItem(validationKey, 'pending');
      try {
        await validateGithub({ code }).unwrap();
        if (validationKey) sessionStorage.setItem(validationKey, 'done');
        setStatus('Success! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } catch {
        if (validationKey) sessionStorage.removeItem(validationKey);
        setStatus('Failed to link GitHub account. See console for details.');
      }
    };

    linkAccount();
  }, [navigate, validateGithub]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}

export { GitHubCallback };
export default GitHubCallback;
