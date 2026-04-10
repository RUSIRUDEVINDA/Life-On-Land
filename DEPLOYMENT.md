# Deployment (Render backend + Vercel frontend)

This repo currently contains only the backend (`backend/`). If your frontend is in a separate repo, apply the Vercel steps there.

## Recommended branch strategy (develop -> main)

- Keep `develop` for day-to-day development.
- Create/use `main` as **production**.
- Deploy **production** from `main` (Render + Vercel).
- Merge via PR: `develop` -> `main` (and protect `main` so CI must pass before merge).

You do **not** need to rename `develop` to "production". Use branch + environment variables to separate dev/staging/prod.

### If your GitHub default branch is currently `develop`

- Leave it as-is while you are still changing things.
- Create `main` when you are ready for your first production release.
- Point Render/Vercel **production** to `main` (even if GitHub default stays `develop`).
- Later (optional): switch GitHub default branch to `main` once the team workflow is stable.

## Backend on Render

### 1) Render service settings

Create a new **Web Service** on Render and connect your Git repo.

- **Branch**: `main` (production)
- **Root Directory**: `backend`
- **Build Command**: `npm ci`
- **Start Command**: `npm start`

### 2) Environment variables (Render)

Set these in Render (Dashboard -> Service -> Environment):

- `MONGO_URI` (required)
- `JWT_SECRET` (required)
- `JWT_EXPIRES_IN` (optional, e.g. `7d`)
- `NODE_ENV=production`
- `CORS_ORIGIN` (recommended; comma-separated):
  - Example: `https://your-frontend.vercel.app,https://yourdomain.com`

Notes:
- Render injects `PORT` automatically; the backend already uses `process.env.PORT`.
- Backend CORS is now configurable via `CORS_ORIGIN` (see `backend/server.js`).

## Frontend on Vercel

### 1) Project settings

Import your frontend repo into Vercel.

- Set the correct **Root Directory** (if your frontend is in a subfolder).
- Confirm the framework preset (Next.js / Vite / CRA etc).

### 2) Production branch

In Vercel project settings, set **Production Branch** to `main`.

If your GitHub default branch is still `develop`, this setting is what prevents "develop pushes" from going straight to production.

### 3) Environment variables (Vercel)

Set your API base URL to the Render backend URL, for example:

- Vite: `VITE_API_URL=https://your-render-service.onrender.com`
- Next.js: `NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com`

Use separate values for:
- **Production**: points to Render production service
- **Preview**: points to a staging backend (optional), or the same backend if you don't have staging

## CI/CD (simple + production-safe)

1. CI uses separate workflow files:
   - `/.github/workflows/ci-dev.yml` (runs on `develop`)
   - `/.github/workflows/ci-main.yml` (runs on `main`)
   - `/.github/workflows/backend-tests.yml` is the reusable workflow called by both
2. Protect `main` in GitHub:
   - Require the CI check to pass before merge.
3. CD options:
   - Platform Git deploy (recommended): enable Auto-Deploy in Render and Vercel and deploy from `main`
   - Optional manual deploy hook: `/.github/workflows/deploy-render-prod.yml` is set to `workflow_dispatch` (manual) and can POST your Render Deploy Hook URL (`RENDER_DEPLOY_HOOK_URL` secret) using the GitHub `production` environment (use this only if Auto-Deploy is OFF)

Result:
- Pushes to `develop` don't affect production.
- Merging `develop` -> `main` triggers production deployments automatically.
