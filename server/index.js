// load the env settings before starting the server
require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

// set up the api and serve the frontend
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // warn early if the jwt secret is missing
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Authentication will fail until it is configured.');
  }

  // open the database once so the routes can share it
  app.locals.db = await initDb();

  // let the local vite frontend send cookies to the api
  // the deployed app and api share an origin
  app.use(
    cors({
      origin: isProduction ? false : ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' })); // cap json request bodies at 1mb
  app.use(cookieParser()); // read cookies before checking the session

  // give the landing page a quick way to check if the api is up
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // set up the auth and capsule routes
  app.use('/auth', authRoutes); // sign in, sign out and session check
  app.use('/api/capsules', capsuleRoutes); // read and write the users saved capsules

  // serve the built react app
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // let react handle page urls when someone opens them directly
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next(); // keep normal 404s for missing api or auth routes
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        // this can happen before the frontend is built
        res.status(404).send(
          'Frontend not built yet. Run "npm run build" or use "npm run dev" for local development.'
        );
      }
    });
  });

  // log the details on the server and send a generic error
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`AI Capsule listening on port ${PORT}`);
  });
}

// log startup errors and stop if the app cant start
main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
