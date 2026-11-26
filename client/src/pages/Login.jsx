import { Link, useSearchParams } from 'react-router-dom';

// turn the error code from the login redirect into a readable message
const ERROR_MESSAGES = {
  oauth_denied: 'GitHub login was cancelled or denied.',
  token_exchange: 'Could not complete OAuth token exchange.',
  user_fetch: 'Could not load your GitHub profile.',
  server: 'Login failed on the server. Try again.'
};

// github sign in and any error from the last attempt
export default function Login() {
  const [params] = useSearchParams();
  const error = params.get('error'); // set by the redirect if login fails

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

        {/* show what went wrong with the last login */}
        {error && (
          <p className="alert" role="alert">
            {ERROR_MESSAGES[error] || 'Login failed. Please try again.'}
          </p>
        )}

        {/* use a regular link so the request goes to the server */}
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
