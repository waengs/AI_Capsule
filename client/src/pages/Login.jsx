import { Link, useSearchParams } from 'react-router-dom';

// Maps the ?error=... codes that the OAuth callback redirects with to friendly messages.
const ERROR_MESSAGES = {
  oauth_denied: 'GitHub login was cancelled or denied.',
  token_exchange: 'Could not complete OAuth token exchange.',
  user_fetch: 'Could not load your GitHub profile.',
  server: 'Login failed on the server. Try again.'
};

// Login page: a single "Continue with GitHub" button plus any error from a failed attempt.
export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error'); // Present when redirected back after a failure.

  return (
    <div className="page-shell login-page">
      <header className="topbar">
        <Link to="/" className="brand-mark">
          AI Capsule
        </Link>
      </header>

      <main className="login-panel">
        <h1>Welcome back</h1>
        <p className="lede compact">
          Sign in using your GitHub account to access your personal AI prompts. After authorization, your secure session is safely handled by an HttpOnly cookie.
        </p>

        {/* Show a friendly error if the last login attempt failed. */}
        {error && (
          <p className="alert" role="alert">
            {ERROR_MESSAGES[error] || 'Login failed. Please try again.'}
          </p>
        )}

        {/* Plain link (not client-side route) so the browser hits the server OAuth endpoint. */}
        <a className="btn btn-primary btn-wide" href="/auth/github">
          Continue with GitHub
        </a>

        <p className="muted small">
          Simple and passwordless. We use GitHub OAuth for authentication, so there are no extra passwords to remember.
        </p>
      </main>
    </div>
  );
}
