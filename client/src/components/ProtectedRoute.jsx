import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../api';

// only show the page if the session is valid
// check the session when the page opens
export default function ProtectedRoute({ children }) {
  // wait for the session check before deciding where to go
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    // skip state updates if the page already closed
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) setState({ loading: false, user: data.user });
      })
      .catch(() => {
        // a failed check sends the user back to login
        if (!cancelled) setState({ loading: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // show this while the session check is running
  if (state.loading) {
    return (
      <div className="page-shell center">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  // go to login if theres no user
  if (!state.user) {
    return <Navigate to="/login" replace />;
  }

  // session is valid so show the page
  return children;
}
