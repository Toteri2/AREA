import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar, ProtectedRoute } from './components';
import { AuthProvider } from './context/AuthContext';
import { Dashboard, GitHub, Login, Profile, Register } from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className='app'>
          <Navbar />
          <main className='main-content'>
            <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/github' element={<GitHub />} />
              </Route>
              <Route path='/' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
