import { Link, useSearchParams } from 'react-router-dom';

const ERROR_MESSAGES = {
  oauth_denied: 'GitHub login was cancelled or denied.',
  token_exchange: 'Could not complete OAuth token exchange.',
  user_fetch: 'Could not load your GitHub profile.',
  server: 'Login failed on the server. Try again.'
};

export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <div className="page-shell login-page">
      <header className="topbar">
        <Link to="/" className="brand-mark">
          AI Capsule
        </Link>
      </header>

      <main className="login-panel">
        <h1>Sign in</h1>
        <p className="lede compact">
          GitHub OAuth creates your session. The Express backend then issues an
          application JWT in a Secure, HttpOnly cookie named <code>token</code>.
        </p>

        {error && (
          <p className="alert" role="alert">
            {ERROR_MESSAGES[error] || 'Login failed. Please try again.'}
          </p>
        )}

        <a className="btn btn-primary btn-wide" href="/auth/github">
          Continue with GitHub
        </a>

        <p className="muted small">
          No username/password registration — OAuth only, as required.
        </p>
      </main>
    </div>
  );
}
