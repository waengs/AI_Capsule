const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function appBaseUrl() {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

function clientBaseUrl() {
  // In local Vite dev, redirect to the frontend origin after OAuth.
  // In production (same-origin deploy), APP_URL is used.
  return (process.env.CLIENT_URL || process.env.APP_URL || appBaseUrl()).replace(/\/$/, '');
}

router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('GITHUB_CLIENT_ID is not configured');
  }

  const redirectUri = `${appBaseUrl()}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email'
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get('/github/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${clientBaseUrl()}/login?error=oauth_denied`);
  }

  try {
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
      return res.redirect(`${clientBaseUrl()}/login?error=token_exchange`);
    }

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
    const appJwt = jwt.sign(
      {
        sub: String(ghUser.id),
        login: ghUser.login,
        name: ghUser.name || ghUser.login,
        avatar: ghUser.avatar_url
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', appJwt, cookieOptions());
    return res.redirect(`${clientBaseUrl()}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${clientBaseUrl()}/login?error=server`);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

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
