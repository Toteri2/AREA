import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  logout,
  useAppDispatch,
  useAppSelector,
  useGetProfileQuery,
} from 'shared-redux/web';
import { Navbar } from './components';
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
} from './pages';
import './App.css';

function App() {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { isLoading, error } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  // Handle expired or invalid tokens
  useEffect(() => {
    if (
      error &&
      'status' in error &&
      (error.status === 401 || error.status === 403)
    ) {
      console.warn('Authentication failed, logging out...');
      dispatch(logout());
    }
  }, [error, dispatch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className='app'>
        <Navbar />
        <main className='main-content'>
          <Routes>
            {isAuthenticated ? (
              <>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/github' element={<GitHub />} />
                <Route path='/gmail' element={<Gmail />} />
                <Route path='/microsoft' element={<Microsoft />} />
                <Route path='/reactions' element={<Reactions />} />
                <Route path='/github/callback' element={<GitHubCallback />} />
                <Route path='/gmail/callback' element={<GmailCallback />} />
                <Route
                  path='/microsoft/callback'
                  element={<MicrosoftCallback />}
                />
                <Route
                  path='*'
                  element={<Navigate to='/dashboard' replace />}
                />
              </>
            ) : (
              <>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/github/callback' element={<GitHubCallback />} />
                <Route
                  path='/microsoft/callback'
                  element={<MicrosoftCallback />}
                />
                <Route path='*' element={<Navigate to='/login' replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
