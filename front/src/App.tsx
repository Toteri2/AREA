import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  logout,
  useAppDispatch,
  useAppSelector,
  useGetProfileQuery,
} from 'shared-redux/web';
import { GoogleCallback } from './components/GoogleCallback';
import AppLayout from './layout/AppLayout';
import NoNavbarLayout from './layout/NoNavbarLayout';
import {
  Area,
  Dashboard,
  Discord,
  DiscordCallback,
  Dynamic-UI,
  GitHubCallback,
  GmailCallback,
  Login,
  MicrosoftCallback,
  NotFound,
  Profile,
  Register,
} from './pages';
import './App.css';

function App() {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
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
      <Routes>
        <Route element={<NoNavbarLayout />}>
          <Route path='/github/callback' element={<GitHubCallback />} />
          <Route path='/gmail/callback' element={<GmailCallback />} />
          <Route path='/microsoft/callback' element={<MicrosoftCallback />} />
          <Route path='/google/callback' element={<GoogleCallback />} />
          <Route path='/discord/callback' element={<GoogleCallback />} />
        </Route>

        <Route element={<AppLayout />}>
          {isAuthenticated ? (
            <>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/area' element={<Area />} />
              <Route path='/notfound' element={<NotFound />} />
              <Route path='*' element={<Navigate to='/notfound' replace />} />
            </>
          ) : (
            <>
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/notfound' element={<NotFound />} />
              <Route path='*' element={<Navigate to='/notfound' replace />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
