# AI Capsule

Cloud-deployed AI prompt manager (Assignment 3, CSE3CWA / CSE5006).

React frontend + Express backend + GitHub OAuth + application JWT (HttpOnly cookie `token`) + SQLite CRUD.

## Deployed URL

- **Public URL:** _add after deployment, e.g. `https://ai-capsule.onrender.com`_
- **Cloud platform:** Render (recommended), or Azure App Service or another public host

## Features

- Public landing page `/`
- GitHub OAuth login `/login` → `/auth/github`
- Protected dashboard `/dashboard`
- CRUD API under exact paths required by the brief:
  - `GET /api/health` → `{ "status": "ok" }` (public)
  - `GET|POST /api/capsules`, `PUT|DELETE /api/capsules/:id` (JWT-protected)

## Local setup

### 1. Install

```bash
npm install
npm install --prefix client
```

### 2. Environment

Copy `.env.example` to `.env` and fill in values:

| Variable | Purpose |
|---|---|
| `PORT` | Express port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `APP_URL` | Express public origin (OAuth callback base) |
| `CLIENT_URL` | Optional Vite origin for post-login redirect locally |
| `JWT_SECRET` | Secret used to sign/verify the **application** JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `DATABASE_PATH` | Optional SQLite file path |

Create a GitHub OAuth App at https://github.com/settings/developers :

- Homepage URL: `http://localhost:3000` (local) or your deployed URL
- Authorization callback URL: `{APP_URL}/auth/github/callback`

Never commit real secrets.

### 3. Run (development)

```bash
npm run dev
```

- Frontend: http://localhost:5173 (proxies `/api` and `/auth` to Express)
- Backend: http://localhost:3000

### 4. Production-style local run

```bash
npm run build
npm start
```

Then open http://localhost:3000

## How frontend talks to Express

The React app calls same-origin paths with `credentials: 'include'` so the `token` cookie is sent:

- `GET /auth/me`: current user from verified JWT
- `POST /auth/logout`: clear cookie
- `GET/POST/PUT/DELETE /api/capsules`: CRUD

In production, Express serves `client/dist` from the same public URL (avoids CORS/cookie issues).

## OAuth + JWT flow

1. User visits `/login` and clicks **Continue with GitHub** → `GET /auth/github`
2. GitHub redirects to `/auth/github/callback` with a `code`
3. Express exchanges the code for a GitHub access token, loads the GitHub user profile
4. Express **issues its own application JWT** (`jsonwebtoken`) with `sub` = GitHub user id
5. JWT is stored in a **Secure, HttpOnly** cookie named **`token`** (`Secure` only when `NODE_ENV=production`)
6. Protected routes use `requireAuth` middleware to verify the JWT; `user_id` for CRUD is taken from the verified JWT (`req.user.id`), never from the request body

## Database

SQLite via `sql.js` (pure JS, file-backed, no native build tools required). On first start the server creates:

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  prompt_title TEXT NOT NULL,
  prompt_version TEXT,
  prompt_text TEXT NOT NULL,
  response_summary TEXT,
  category TEXT,
  usefulness TEXT,
  reviewed INTEGER DEFAULT 0,
  improved INTEGER DEFAULT 0,
  screenshot_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Default file: `data/capsules.db`.

**Persistence note (Render free tier):** the local filesystem is ephemeral. SQLite data may be lost after restart/redeploy. Explain this limitation to markers; PostgreSQL can be used later if persistent storage is required.

## Deploy on Render

1. Push this repo to GitHub
2. Create a **Web Service** on Render
3. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
4. Set environment variables (names only shown here; put real values in Render):
   - `NODE_ENV=production`
   - `APP_URL=https://YOUR-SERVICE.onrender.com`
   - `JWT_SECRET=...`
   - `GITHUB_CLIENT_ID=...`
   - `GITHUB_CLIENT_SECRET=...`
5. Update the GitHub OAuth App homepage + callback to the Render URL
6. Unset `CLIENT_URL` in production (same-origin)

## Required cURL checks (deployed)

```bash
# Test 1 - no authentication → 401
curl -i https://YOUR-APP/api/capsules

# Test 2 - fake / invalid JWT → 401
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
```

### Results obtained

_Paste your deployed results here after testing:_

```
Test 1: HTTP/… 401 …
Test 2: HTTP/… 401 …
```

## One honest limitation

On Render’s free web service, SQLite storage is ephemeral: capsule rows can disappear after a cold start or redeploy.

## AI-assisted development

- **AI tools used:** Cursor (Composer) for scaffolding React/Express/OAuth/JWT/SQLite and README.
- **Problem found & corrected:** Early OAuth redirect always used `/dashboard` on the API origin, which broke local Vite development (no SPA on port 3000 until build). Fixed by adding optional `CLIENT_URL` for post-login redirect while keeping the OAuth callback on `APP_URL`.
- **How OAuth/JWT/API protection were verified:** Successful GitHub login reaches `/dashboard`; `GET /api/capsules` without a cookie and with `token=fake-token-123` both return 401; authenticated CRUD works after login.
- **How CRUD/ownership were verified:** Created, listed, updated and deleted capsules while signed in; `user_id` is set server-side from JWT `sub`; update/delete only match `id` **and** `user_id`.
- **Independent decision:** Serve React `dist` from Express on one public URL so the HttpOnly `token` cookie stays same-site and CORS configuration stays simple for marking.

## Project structure

```
├── client/                 # React (Vite)
├── server/
│   ├── index.js            # Express app + static SPA
│   ├── db.js               # SQLite init
│   ├── middleware/auth.js  # JWT cookie verification
│   └── routes/
│       ├── auth.js         # GitHub OAuth + /me + logout
│       └── capsules.js     # Protected CRUD
├── .env.example
├── package.json
└── README.md
```
