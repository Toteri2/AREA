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
  Dashboard,
  GitHub,
  GitHubCallback,
  Gmail,
  GmailCallback,
  Login,
  Microsoft,
  MicrosoftCallback,
  Profile,
  Reactions,
  Register,
  Services,
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
        </Route>

        <Route element={<AppLayout />}>
          {isAuthenticated ? (
            <>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/github' element={<GitHub />} />
              <Route path='/gmail' element={<Gmail />} />
              <Route path='/microsoft' element={<Microsoft />} />
              <Route path='/reactions' element={<Reactions />} />
              <Route path='/services' element={<Services />} />
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </>
          ) : (
            <>
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='*' element={<Navigate to='/login' replace />} />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
