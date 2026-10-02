docker compose up --build -d
# Anarva Clinic — AI hair-loss assessment platform

This project serves a clinic marketing site plus an AI-driven hair-loss assessment workflow.

| Area | Purpose |
| --- | --- |
| `/` | Marketing website and landing page |
| `/hair-loss-assessment/` | Vite + React patient assessment UI |
| `/api/*` | FastAPI backend for AI analysis, patient storage, and doctor portal |

The frontend and backend are now structured for independent deployment so they can run on different cloud services without sharing runtime secrets or build artifacts.

## Recommended deployment structure

```text
repo/
├── apps/
│   ├── frontend/      # React app for clinic UI and assessment flow
│   └── backend/       # FastAPI app for AI + records + notifications
├── site/              # Static marketing pages
├── src/               # Current frontend source kept compatible with Vite
├── backend/           # Existing FastAPI service kept working during transition
├── supabase/           # SQL schema and RLS setup
├── legacy/             # Reference prototypes
├── docs/               # deployment notes and operational docs
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

This is the safest split for a cloud deployment model:

- Frontend: static hosting such as Vercel or Netlify
- Backend: container hosting such as Render, Railway, Azure App Service, or Fly.io
- Database: Supabase managed database

## Local development

Prerequisites: Node.js 20+, Python 3.11+

```bash
npm install
pip install -r backend/requirements.txt
cp .env.example .env
npm run build
npm start
```

For hot-refresh frontend work, run:

```bash
npm run dev
```

Then open http://localhost:5173/hair-loss-assessment/ and keep the backend at http://localhost:3000.

## Frontend/backend split

For separate deployments, set the frontend environment variable:

```bash
VITE_API_BASE_URL=https://your-backend-url.example.com
```

The browser will use that value instead of assuming the API lives on the same origin. The app now resolves API calls through a shared helper in `src/lib/api.ts`.

## Deployment checklist

- `ENVIRONMENT=production`
- strong `SECRET_KEY`
- `DOCTOR_USERNAME` and `DOCTOR_PASSWORD`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- HTTPS enabled in front of both services

Apply `supabase/schema.sql` to create the tables with RLS enabled. Keep the service-role key on the backend only.

## Tests

```bash
npm run test:backend
# or
cd backend && python -m pytest
```

## GitHub push

Once the repo is ready, push the branch to the GitHub remote already configured for this project:

```bash
git add .
git commit -m "Prepare split frontend and backend deployment structure"
git push origin main
```

## Backend layout (`backend/app`)

`api/` routes · `schemas/` Pydantic models · `services/` business logic · `ai/` prompt and Gemini client · `storage.py` Supabase persistence · `config.py` settings · `errors.py` error handling.

## Environment

See `.env.example`. Patient assessments and appointments are stored in Supabase; SQLite is used only by isolated backend tests.

## legacy/

Earlier vanilla-JS prototype of the analysis app plus its Python API tests and sample database, kept for reference.
