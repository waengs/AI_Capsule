import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// pages for the app
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} /> {/* anyone can open the landing page */}
      <Route path="/login" element={<Login />} /> {/* sign in with github */}
      <Route
        path="/dashboard"
        element={
          // send people to login if their session is gone
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* send unknown urls back to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
