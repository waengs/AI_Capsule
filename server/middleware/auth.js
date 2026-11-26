const jwt = require('jsonwebtoken');

// reject requests that dont have a valid session token
// give the route the verified user once the token checks out
function requireAuth(req, res, next) {
  // get the jwt from the session cookie
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // check the signature and expiry before trusting the user id
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: String(payload.sub), // use the github id to find the users own capsules
      login: payload.login,
      name: payload.name,
      avatar: payload.avatar
    };
    return next();
  } catch {
    // invalid or expired tokens get a 401
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { requireAuth };
