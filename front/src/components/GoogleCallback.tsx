import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadToken, persistToken } from '../shared/src/features/authSlice';
import { useAppDispatch, useAppSelector } from '../shared/src/hooks';
import type { ApiAuthResponse } from '../shared/src/types';
import { useGoogleAuthValidateMutation } from '../shared/src/web';

export function GoogleCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [status, setStatus] = useState('Validating session...');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [googleAuthValidate, { isLoading }] = useGoogleAuthValidateMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    console.log('Google Callback params:', { code, state });

    const validationKey = code ? `google-callback:${code}` : null;
    if (validationKey && sessionStorage.getItem(validationKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('Session already validated. Redirecting...');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRedirect(true);
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
        window.location.href = `area://auth/google?code=${code}`;
        return;
      }
    } catch (e) {
      console.error('State decode failed', e);
    }

    const linkAccount = async () => {
      setStatus('Linking your Google account...');
      if (validationKey) sessionStorage.setItem(validationKey, 'pending');
      try {
        const data = await googleAuthValidate({
          code,
          ...(state && { state }),
        }).unwrap();

        const token = (data as ApiAuthResponse).access_token;
        if (token) {
          await dispatch(persistToken(token)).unwrap();
          await dispatch(loadToken()).unwrap();
          if (validationKey) sessionStorage.setItem(validationKey, 'done');
          setStatus('Success! Redirecting...');
          setShouldRedirect(true);
        } else {
          setStatus('Failed to get authentication token.');
          if (validationKey) sessionStorage.removeItem(validationKey);
        }
      } catch (error) {
        console.error('Google validation error:', error);
        setStatus('Failed to link Google account. See console for details.');
        if (validationKey) sessionStorage.removeItem(validationKey);
      }
    };

    linkAccount();
  }, [googleAuthValidate, dispatch]);

  useEffect(() => {
    if (shouldRedirect && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [shouldRedirect, isAuthenticated, navigate]);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}
    >
      <h2>{status}</h2>
      {isLoading && <p>Validating...</p>}
    </div>
  );
}
