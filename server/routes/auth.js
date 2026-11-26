// Authentication routes: GitHub OAuth login flow plus session helpers (/me, /logout).
const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Shared cookie settings for the session token.
function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Not readable from JavaScript, which limits XSS token theft.
    secure: isProduction, // Only sent over HTTPS in production.
    sameSite: 'lax', // Sent on top-level navigations, which the OAuth redirect needs.
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matching the JWT expiry.
    path: '/'
  };
}

// Base URL of this server, used to build the OAuth redirect URI.
function appBaseUrl() {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

// Base URL to redirect the browser back to after login.
function clientBaseUrl() {
  // In local Vite dev, redirect to the frontend origin after OAuth.
  // In production (same-origin deploy), APP_URL is used.
  return (process.env.CLIENT_URL || process.env.APP_URL || appBaseUrl()).replace(/\/$/, '');
}

// Step 1 of OAuth: send the user to GitHub's authorization screen.
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('GITHUB_CLIENT_ID is not configured');
  }

  // GitHub redirects back here with a short-lived authorization code.
  const redirectUri = `${appBaseUrl()}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email' // Minimal scopes: profile and email only.
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// Step 2 of OAuth: GitHub redirects back here with ?code=...
router.get('/github/callback', async (req, res) => {
  const { code, error } = req.query;

  // User denied access or GitHub returned an error.
  if (error || !code) {
    return res.redirect(`${clientBaseUrl()}/login?error=oauth_denied`);
  }

  try {
    // Exchange the authorization code for an access token.
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appBaseUrl()}/auth/github/callback`
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      // Token exchange failed (bad code, wrong client secret, etc.).
      return res.redirect(`${clientBaseUrl()}/login?error=token_exchange`);
    }

    // Use the access token to fetch the authenticated user's profile.
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AI-Capsule-App'
      }
    });

    if (!userRes.ok) {
      return res.redirect(`${clientBaseUrl()}/login?error=user_fetch`);
    }

    const ghUser = await userRes.json();
    // Mint our own session JWT from the GitHub profile (we never store GitHub's token).
    const appJwt = jwt.sign(
      {
        sub: String(ghUser.id), // Stable user identifier.
        login: ghUser.login,
        name: ghUser.name || ghUser.login,
        avatar: ghUser.avatar_url
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store the session as an HttpOnly cookie, then send the user into the app.
    res.cookie('token', appJwt, cookieOptions());
    return res.redirect(`${clientBaseUrl()}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${clientBaseUrl()}/login?error=server`);
  }
});

// Return the current user, or 401 if the session is missing/invalid.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Clear the session cookie. Options must match those used when setting it.
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  res.json({ ok: true });
});

module.exports = router;
