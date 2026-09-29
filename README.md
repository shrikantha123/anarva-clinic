# Anarva Clinic — website + AI hair loss analysis

Single app that serves two things:

| Path | Content |
| --- | --- |
| `/` | Clinic marketing website (static HTML/CSS/JS in `site/`) |
| `/hair-loss-assessment/` | React + Vite AI hair loss analysis app (`src/`) |
| `/api/*`, `/health` | FastAPI + Gemini backend (`backend/`) |

The "Hair Loss Assessment" button on the clinic homepage links to
`/hair-loss-assessment/`, which loads the React analysis flow
(quiz → photos → analysis → report → doctor portal).

## Run locally

Prerequisites: Node.js 20+, Python 3.11+

```bash
npm install
pip install -r backend/requirements.txt
cp .env.example .env      # set GEMINI_API_KEY and DOCTOR_PASSWORD
npm run build             # React app -> dist/
npm start                 # http://localhost:3000 (site, app and API)
```

Frontend development with hot reload: run `npm start` in one terminal and `npm run dev`
in another, then open http://localhost:5173/hair-loss-assessment/ (`/api` is proxied).

Tests: `npm run test:backend` (or `pip install -r backend/requirements-dev.txt && cd backend && python -m pytest`)

## Deploy

| Artifact | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build: Vite → `dist/`, then Python 3.12 + uvicorn |
| `docker-compose.yml` | Single service on port 3000, persistent SQLite volume at `/data` |
| `.env` | Secrets (never commit); mount via `env_file` in Compose |

```bash
cp .env.example .env   # set GEMINI_API_KEY, DOCTOR_PASSWORD, SECRET_KEY
npm run build
docker compose up --build -d
```

Production checklist: `ENVIRONMENT=production`, strong `SECRET_KEY` and `DOCTOR_PASSWORD`, persistent `DATABASE_PATH`, HTTPS in front of the app.

## Repository layout

```
merged/
├── site/                 # Marketing site (/)
├── src/                  # React hair-loss assessment UI
├── dist/                 # Vite build output (generated)
├── backend/
│   ├── app/              # FastAPI application
│   ├── tests/            # Pytest regression suite
│   └── data/             # SQLite (local dev, gitignored)
├── legacy/               # Old prototype (reference only)
├── Dockerfile
└── docker-compose.yml
```

## Backend layout (`backend/app`)

`api/` routes · `schemas/` Pydantic models (the AI contract lives in `schemas/analysis.py`) ·
`services/` business logic · `ai/` prompt, Gemini client, retry/validation · `images.py` upload
validation · `db.py` SQLite · `config.py` settings · `errors.py` error handling.

## Environment

See `.env.example`. Data is stored in SQLite at `DATABASE_PATH`; use a persistent volume in production.

## legacy/

Earlier vanilla-JS prototype of the analysis app plus its Python API tests and
sample database, kept for reference. It is not served by `server.ts`.
