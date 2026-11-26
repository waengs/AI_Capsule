// Load environment variables from .env into process.env before anything else.
require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

// Entry point: wires up middleware, routes, and the static frontend, then starts listening.
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // JWT signing/verification needs this secret, so warn early if it is missing.
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Authentication will fail until it is configured.');
  }

  // Open (or create) the SQLite database and share the handle via app.locals for route access.
  app.locals.db = await initDb();

  // CORS: in dev the Vite frontend runs on a different origin, so allow it and send cookies.
  // In production the frontend is served from this same server, so cross-origin is disabled.
  app.use(
    cors({
      origin: isProduction ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' })); // Parse JSON request bodies (capped at 1mb).
  app.use(cookieParser()); // Parse cookies so auth middleware can read the session token.

  // Lightweight health check used by the landing page and uptime monitors.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount feature routers.
  app.use('/auth', authRoutes); // GitHub OAuth login/logout and session info.
  app.use('/api/capsules', capsuleRoutes); // CRUD for the user's saved prompt capsules.

  // Serve the built React app from client/dist.
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA fallback: send index.html for any non-API/auth route so client-side routing works.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next(); // Let real API/auth routes 404 normally instead of returning HTML.
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        // Reached when the frontend has not been built yet.
        res.status(404).send(
          'Frontend not built yet. Run "npm run build" or use "npm run dev" for local development.'
        );
      }
    });
  });

  // Catch-all error handler: log the error and hide details from the client.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`AI Capsule listening on port ${PORT}`);
  });
}

// Start the server, failing loudly if startup (e.g. DB init) throws.
main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
