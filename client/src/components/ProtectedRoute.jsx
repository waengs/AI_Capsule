import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../api';

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) setState({ loading: false, user: data.user });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="page-shell center">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  if (!state.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
