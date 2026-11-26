const jwt = require('jsonwebtoken');

// Express middleware that rejects requests without a valid session token.
// On success it attaches the decoded user to req.user for downstream handlers.
function requireAuth(req, res, next) {
  // The JWT is stored in an HttpOnly cookie named "token".
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify the signature and expiry, then expose a trimmed user object.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: String(payload.sub), // GitHub user id, used to scope capsules per user.
      login: payload.login,
      name: payload.name,
      avatar: payload.avatar
    };
    return next();
  } catch {
    // Any invalid/expired/tampered token lands here.
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAuth };
