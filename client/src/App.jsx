import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Top-level route table for the single-page app.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} /> {/* Public marketing page. */}
      <Route path="/login" element={<Login />} /> {/* GitHub sign-in page. */}
      <Route
        path="/dashboard"
        element={
          // Dashboard requires a valid session; ProtectedRoute redirects otherwise.
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Unknown paths fall back to the landing page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
