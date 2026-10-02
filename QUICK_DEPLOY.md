# Quick Deployment Reference

## Environment Variables Quick Reference

### Backend (Runtime Variables - Set in Cloud Run)
```
ENVIRONMENT=production
SECRET_KEY=your-secret-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
DOCTOR_USERNAME=doctor
DOCTOR_PASSWORD=secure-password
```

### Frontend (Build Variables - Set as Docker Build Args)
```
VITE_API_URL=https://your-backend-url.cloudrun.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key Difference: Build vs Runtime Variables

| Type | When Set | Where Set | Example |
|------|----------|-----------|---------|
| **Build Variables** | During docker build | Docker build args | `--build-arg VITE_API_URL=...` |
| **Runtime Variables** | When container runs | Cloud Run env vars | `--set-env-vars API_KEY=...` |

**Vite vars MUST be build variables** - they're baked into JavaScript at build time!

## Deployment Commands

### Backend
```bash
gcloud run deploy anarva-backend \
  --source ./backend \
  --region us-central1 \
  --set-env-vars ENVIRONMENT=production \
  --set-env-vars SUPABASE_URL=your-url \
  --set-env-vars SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Frontend
```bash
gcloud run deploy anarva-frontend \
  --source ./frontend \
  --region us-central1 \
  --build-arg VITE_API_URL=https://your-backend.cloudrun.app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key
```

## CORS Setup

Update `backend/app/main.py`:
```python
allow_origins=[
    "https://your-frontend.cloudrun.app",  # After frontend deployment
    "https://your-backend.cloudrun.app",   # Backend URL
    "http://localhost:5173",               # Local dev
]
```

## Deployment Order

1. Deploy backend first → get backend URL
2. Update frontend build args with backend URL
3. Deploy frontend → get frontend URL
4. Update backend CORS with frontend URL
5. Redeploy backend

## Free Tier Settings

- CPU: Allocated only during request processing
- Max instances: 1
- Min instances: 0 (scale to zero)
- Memory: 512 MiB
- Region: us-central1 (or similar)
