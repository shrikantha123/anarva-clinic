# Backend service

This directory is intended for the FastAPI backend that handles patient records, AI analysis, notifications, and admin APIs.

## Responsibilities

- `/api/*` endpoints
- Gemini AI orchestration
- Supabase persistence
- email notifications and operational logging
- doctor authentication and admin access

## Deployment notes

- Deploy as a containerized API or Python service.
- Keep `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SECRET_KEY` in the backend environment.
- Expose a public HTTPS URL and allow the frontend to call it via `VITE_API_BASE_URL`.
