// github sign in and session routes
const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// settings for the session cookie
function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // keep browser scripts from reading the cookie
    secure: isProduction, // only send the cookie over https in production
    sameSite: 'lax', // allow the cookie on top level navigation for the login redirect
    maxAge: 7 * 24 * 60 * 60 * 1000, // keep the cookie lifetime the same as the jwt
    path: '/'
  };
}

// use the server address to build the github callback url
function appBaseUrl() {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

// pick where the browser goes after sign in
function clientBaseUrl() {
  // send local users back to vite after sign in
  // on render the frontend and api share the same url
  return (process.env.CLIENT_URL || process.env.APP_URL || appBaseUrl()).replace(/\/$/, '');
}

// send the user to github to sign in
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('GITHUB_CLIENT_ID is not configured');
  }

  // github sends back a short lived code
  const redirectUri = `${appBaseUrl()}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email' // ask for profile and email access
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// handle the code from github
router.get('/github/callback', async (req, res) => {
  const { code, error } = req.query;

  // send the user back to login if github didnt return a code
  if (error || !code) {
    return res.redirect(`${clientBaseUrl()}/login?error=oauth_denied`);
  }

  try {
    // swap the code for a github access token
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
      // go back to login if github didnt issue a token
      return res.redirect(`${clientBaseUrl()}/login?error=token_exchange`);
    }

    // use the token to get the users github profile
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
    // make our own session jwt from the github profile
    const appJwt = jwt.sign(
      {
        sub: String(ghUser.id), // keep the github id as the stable user id
        login: ghUser.login,
        name: ghUser.name || ghUser.login,
        avatar: ghUser.avatar_url
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // set the session cookie and open the dashboard
    res.cookie('token', appJwt, cookieOptions());
    return res.redirect(`${clientBaseUrl()}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(`${clientBaseUrl()}/login?error=server`);
  }
});

// get the signed in user or return a 401
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// clear the cookie using the same settings
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
