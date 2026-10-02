# Frontend service

This directory is intended for the React/Vite frontend that powers the clinic website and the AI assessment journey.

## Responsibilities

- clinic marketing pages
- patient questionnaire and photo upload flow
- AI assessment UI and report display
- doctor portal admin interface

## Deployment notes

- Build as a static site using Vite.
- Set `VITE_API_BASE_URL` to the public URL of the backend service.
- For local development, the default fallback remains the same origin, with Vite proxying `/api` to the backend.
