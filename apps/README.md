# Application layout

This repository is organized for independent deployment of the web frontend and the FastAPI backend.

## Structure

```text
apps/
├── frontend/     # React + Vite patient experience and admin portal
├── backend/      # FastAPI API, AI orchestration, storage, and email workflows
├── shared/       # Optional shared contracts, enums, and helper utilities
```

## Why this layout

- Frontend and backend can be deployed to different cloud providers.
- The browser talks to the backend through `VITE_API_BASE_URL` instead of a same-origin-only path.
- The API can scale independently and keep secrets in its own environment.
- GitHub pushes stay clean because each service has a clear responsibility.

## Recommended deployment targets

- Frontend: Vercel, Netlify, Cloudflare Pages, or any static hosting service.
- Backend: Render, Railway, Fly.io, Azure App Service, or a containerized cloud VM.

## Runtime config

- Frontend: set `VITE_API_BASE_URL` to the public backend URL.
- Backend: set all API keys, database credentials, and security secrets in the backend service environment.
