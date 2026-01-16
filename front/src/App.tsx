import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { RootState } from 'shared-redux/store';
import {
  logout,
  useAppDispatch,
  useAppSelector,
  useGetProfileQuery,
} from 'shared-redux/web';
import { GoogleCallback } from './components/GoogleCallback';
import AppLayout from './layout/AppLayout';
import NoNavbarLayout from './layout/NoNavbarLayout';
import './App.css';

// Lazy-loaded page components for code splitting
const BlueprintEditor = lazy(
  () => import('./pages/BlueprintEditor/BlueprintEditor')
);
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// OAuth callbacks - lazy loaded
const DiscordCallback = lazy(() => import('./pages/DiscordCallback'));
const GitHubCallback = lazy(() => import('./pages/GitHubCallback'));
const GmailCallback = lazy(() => import('./pages/GmailCallback'));
const JiraCallback = lazy(() => import('./pages/JiraCallback'));
const MicrosoftCallback = lazy(() => import('./pages/MicrosoftCallback'));
const TwitchCallback = lazy(() => import('./pages/TwitchCallback'));

// Loading fallback component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    Loading...
  </div>
);

function App() {
  const { isAuthenticated, token } = useAppSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useAppDispatch();

  const { isLoading, error } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (
      error &&
      'status' in error &&
      (error.status === 401 || error.status === 403)
    ) {
      dispatch(logout());
    }
  }, [error, dispatch]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<NoNavbarLayout />}>
            <Route path='/github/callback' element={<GitHubCallback />} />
            <Route path='/gmail/callback' element={<GmailCallback />} />
            <Route path='/microsoft/callback' element={<MicrosoftCallback />} />
            <Route path='/google/callback' element={<GoogleCallback />} />
            <Route path='/discord/callback' element={<DiscordCallback />} />
            <Route path='/jira/callback' element={<JiraCallback />} />
            <Route path='/twitch/callback' element={<TwitchCallback />} />
          </Route>

          <Route element={<AppLayout />}>
            {isAuthenticated ? (
              <>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/area' element={<BlueprintEditor />} />
                <Route
                  path='/config'
                  element={<Navigate to='/area' replace />}
                />
                <Route path='/notfound' element={<NotFound />} />
                <Route path='/' element={<Dashboard />} />
                <Route
                  path='/login'
                  element={<Navigate to='/dashboard' replace />}
                />
                <Route
                  path='/register'
                  element={<Navigate to='/dashboard' replace />}
                />
                <Route path='*' element={<Navigate to='/notfound' replace />} />
              </>
            ) : (
              <>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/notfound' element={<NotFound />} />
                <Route path='/' element={<Login />} />
                <Route path='*' element={<Navigate to='/login' replace />} />
              </>
            )}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
