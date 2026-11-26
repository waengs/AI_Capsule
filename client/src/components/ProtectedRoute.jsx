import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../api';

// Route guard: renders children only if the user has a valid session.
// Checks the session by calling /auth/me on mount.
export default function ProtectedRoute({ children }) {
  // loading: still checking; user: resolved user or null if unauthenticated.
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    // Guard against setting state after the component unmounts.
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) setState({ loading: false, user: data.user });
      })
      .catch(() => {
        // Any failure (e.g. 401) means no valid session.
        if (!cancelled) setState({ loading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While the session check is in flight, show a placeholder.
  if (state.loading) {
    return (
      <div className="page-shell center">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  // Not logged in: bounce to the login page.
  if (!state.user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated: render the protected content.
  return children;
}
