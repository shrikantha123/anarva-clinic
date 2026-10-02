# GCP Cloud Run Deployment Guide

Complete guide for deploying Anarva Clinic to Google Cloud Run using the free tier.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   Frontend (React)   │         │   Backend (FastAPI)  │  │
│  │   Cloud Run Service  │◄────────│   Cloud Run Service  │  │
│  │   Port: 8080         │  CORS   │   Port: 8080         │  │
│  │   Nginx + Static     │────────►│   Uvicorn + API      │  │
│  └──────────────────────┘         └──────────────────────┘  │
│            │                                  │               │
│            │                                  │               │
│            └──────────────┬───────────────────┘               │
│                           │                                   │
│                           ▼                                   │
│                  ┌──────────────┐                            │
│                  │   Supabase   │                            │
│                  │   Database   │                            │
│                  └──────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Google Cloud Account** with billing enabled (free tier eligible)
2. **GitHub Repository** with your code
3. **Supabase Project** with credentials
4. **Gmail Service Account** (for email notifications)

## Step 1: Configure Backend Environment Variables

### Backend Runtime Variables (Cloud Run)

These are set in Cloud Run after deployment:

```bash
# Required
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
DOCTOR_USERNAME=doctor
DOCTOR_PASSWORD=secure-password

# Optional
GEMINI_MODEL=gemini-2.5-flash
AI_TIMEOUT_SECONDS=60
GMAIL_NOTIFICATION_EMAIL=anarvaclinic8@gmail.com
GMAIL_SENDER_EMAIL=anarvaclinic8@gmail.com
APP_PUBLIC_URL=https://your-frontend-url.cloudrun.app
```

## Step 2: Configure Frontend Build-Time Variables

### Frontend Build-Time Variables (Docker Build Args)

**IMPORTANT**: Vite environment variables are **baked into the JavaScript bundle at build time**. They must be passed as Docker build arguments, not runtime environment variables.

### Cloud Run Build Variables

When deploying frontend to Cloud Run, set these as **Build Variables**:

```bash
VITE_API_URL=https://your-backend-url.cloudrun.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### How These Work

1. **Build Time**: Docker ARGs are passed during `docker build`
2. **Vite Build**: Vite replaces `import.meta.env.VITE_*` with actual values
3. **Runtime**: Values are hardcoded in the bundled JavaScript
4. **No Runtime ENV Needed**: These don't need to be set as Cloud Run runtime variables

### Example: Building Locally with Args

```bash
cd frontend
docker build \
  --build-arg VITE_API_URL=https://your-backend.cloudrun.app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t anarva-frontend .
```

## Step 3: Update CORS Configuration

Before deploying, update the CORS origins in `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR_FRONTEND_CLOUD_RUN_URL.cloudrun.app",  # Replace after deployment
        "http://localhost:5173",  # Local development
        "http://localhost:3000",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)
```

**Note**: You'll need to redeploy the backend after getting the frontend URL.

## Step 4: Deploy Backend to Cloud Run

### Option A: Using Google Cloud Console (Recommended for first deployment)

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click "Create Service"
3. Select region (e.g., `us-central1` - free tier eligible)
4. Configure:
   - **Container Source**: "Deploy from GitHub repository"
   - **Repository**: Select your GitHub repo
   - **Branch**: `main`
   - **Context Directory**: `/backend`
   - **Dockerfile**: `Dockerfile` (in backend folder)
5. Click "Next" → "Configure Service"
6. Settings:
   - **Service Name**: `anarva-backend`
   - **Region**: `us-central1` (or your preferred region)
   - **CPU Allocation**: "CPU is only allocated during request processing" (free tier)
   - **Max instances**: Set to 1 (free tier)
   - **Memory**: 512 MiB (free tier)
   - **Min instances**: 0 (scale to zero when idle)
7. **Container, Connectivity, Security**:
   - **Port**: 8080
   - **Environment Variables**: Add all backend variables from Step 1
8. Click "Deploy"

### Option B: Using gcloud CLI

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Deploy backend
gcloud run deploy anarva-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --cpu 1 \
  --memory 512Mi \
  --max-instances 1 \
  --min-instances 0 \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production \
  --set-env-vars SECRET_KEY=your-secret-key \
  --set-env-vars SUPABASE_URL=https://your-project.supabase.co \
  --set-env-vars SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  --set-env-vars GEMINI_API_KEY=your-gemini-api-key \
  --set-env-vars DOCTOR_USERNAME=doctor \
  --set-env-vars DOCTOR_PASSWORD=your-password
```

### Get Backend URL

After deployment, note the backend URL:
```
https://anarva-backend-xxxxx-xxxx.a.run.app
```

## Step 5: Deploy Frontend to Cloud Run

### Update CORS in Backend First

Before deploying frontend, update `backend/app/main.py` with your backend URL in CORS origins:

```python
allow_origins=[
    "https://YOUR_FRONTEND_CLOUD_RUN_URL.cloudrun.app",  # Will add after frontend deployment
    "https://YOUR_BACKEND_CLOUD_RUN_URL.cloudrun.app",  # Add backend URL
    "http://localhost:5173",
    "http://localhost:3000",
],
```

Redeploy backend after this change.

### Deploy Frontend with Build Variables

**CRITICAL**: Build variables must be set at build time, not runtime.

#### Using Google Cloud Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click "Create Service"
3. Select region (same as backend, e.g., `us-central1`)
4. Configure:
   - **Container Source**: "Deploy from GitHub repository"
   - **Repository**: Select your GitHub repo
   - **Branch**: `main`
   - **Context Directory**: `/frontend`
   - **Dockerfile**: `Dockerfile` (in frontend folder)
5. Click "Next" → "Configure Service"
6. **Container, Connectivity, Security**:
   - **Port**: 8080
   - **Build Variables** (IMPORTANT - NOT Runtime Variables):
     - `VITE_API_URL`: `https://your-backend-url.cloudrun.app`
     - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
7. **Service Settings**:
   - **Service Name**: `anarva-frontend`
   - **CPU Allocation**: "CPU is only allocated during request processing"
   - **Max instances**: 1
   - **Memory**: 512 MiB
   - **Min instances**: 0
8. Click "Deploy"

#### Using gcloud CLI

```bash
gcloud run deploy anarva-frontend \
  --source ./frontend \
  --platform managed \
  --region us-central1 \
  --cpu 1 \
  --memory 512Mi \
  --max-instances 1 \
  --min-instances 0 \
  --allow-unauthenticated \
  --build-arg VITE_API_URL=https://your-backend-url.cloudrun.app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Get Frontend URL

After deployment, note the frontend URL:
```
https://anarva-frontend-xxxxx-xxxx.a.run.app
```

## Step 6: Final CORS Update

Now update the backend CORS to include the frontend URL:

```python
allow_origins=[
    "https://anarva-frontend-xxxxx-xxxx.a.run.app",  # Your actual frontend URL
    "https://anarva-backend-xxxxx-xxxx.a.run.app",   # Your backend URL
    "http://localhost:5173",
    "http://localhost:3000",
],
```

Redeploy backend.

## Step 7: Set Up Continuous Deployment from GitHub

### Using Cloud Build (Recommended)

1. **Enable Cloud Build API**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   ```

2. **Create Cloud Build triggers** for each service:

#### Backend Trigger

Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)

- **Name**: `backend-deploy`
- **Event**: Push to branch
- **Branch**: `^main$`
- **Configuration**: Cloud Build configuration file (YAML)
- **Location**: Create `cloudbuild-backend.yaml` in repo root

Create `cloudbuild-backend.yaml`:

```yaml
steps:
  # Build the image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/anarva-backend:$COMMIT_SHA', '-t', 'gcr.io/$PROJECT_ID/anarva-backend:latest', './backend']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/anarva-backend:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/anarva-backend:latest']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'anarva-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/anarva-backend:$COMMIT_SHA'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'ENVIRONMENT=production,SUPABASE_URL=_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=_SUPABASE_SERVICE_ROLE_KEY,GEMINI_API_KEY=_GEMINI_API_KEY,DOCTOR_USERNAME=_DOCTOR_USERNAME,DOCTOR_PASSWORD=_DOCTOR_PASSWORD'

substitutions:
  _SUPABASE_URL: 'https://your-project.supabase.co'
  _SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key'
  _GEMINI_API_KEY: 'your-gemini-api-key'
  _DOCTOR_USERNAME: 'doctor'
  _DOCTOR_PASSWORD: 'your-password'

timeout: '1200s'
```

#### Frontend Trigger

Create `cloudbuild-frontend.yaml`:

```yaml
steps:
  # Build the image with build args
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/anarva-frontend:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/anarva-frontend:latest'
      - '--build-arg'
      - 'VITE_API_URL=_VITE_API_URL'
      - '--build-arg'
      - 'VITE_SUPABASE_URL=_VITE_SUPABASE_URL'
      - '--build-arg'
      - 'VITE_SUPABASE_ANON_KEY=_VITE_SUPABASE_ANON_KEY'
      - './frontend'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/anarva-frontend:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/anarva-frontend:latest']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'anarva-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/anarva-frontend:$COMMIT_SHA'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'
      - '--allow-unauthenticated'

substitutions:
  _VITE_API_URL: 'https://your-backend-url.cloudrun.app'
  _VITE_SUPABASE_URL: 'https://your-project.supabase.co'
  _VITE_SUPABASE_ANON_KEY: 'your-anon-key'

timeout: '1200s'
```

### Using Cloud Run GitHub Integration (Simpler)

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your service (e.g., `anarva-backend`)
3. Click "Edit & Deploy New Revision"
4. Click "Continuous Deployment" tab
5. Click "Set up continuous deployment"
6. Follow instructions to connect GitHub
7. Configure:
   - **Repository**: Your GitHub repo
   - **Branch**: `main`
   - **Build Type**: Dockerfile
   - **Context Directory**: `/backend` or `/frontend`
   - **Dockerfile**: `Dockerfile`

Repeat for both services.

## Step 8: Verify Deployment

### Test Backend Health

```bash
curl https://your-backend-url.cloudrun.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.45
}
```

### Test Frontend

Open your frontend URL in a browser:
```
https://your-frontend-url.cloudrun.app
```

### Test API Connection

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try the quiz flow
4. Check Network tab for API calls to backend
5. Verify no CORS errors

## Step 9: Monitoring and Logs

### View Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=anarva-backend" --limit 50

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=anarva-frontend" --limit 50
```

### Monitor Metrics

Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)

## Step 10: Cost Management (Free Tier)

To stay within free tier limits:

1. **CPU**: Set to "CPU is only allocated during request processing"
2. **Max Instances**: Set to 1
3. **Min Instances**: Set to 0 (scale to zero when idle)
4. **Memory**: 512 MiB
5. **Region**: Choose a region with free tier support

Free tier limits (as of 2024):
- 2 million requests per month
- 200,000 GB-seconds of compute
- 1 GB of network egress per day

## Troubleshooting

### CORS Errors

**Problem**: Browser shows CORS error
**Solution**:
1. Check backend CORS origins include your frontend URL
2. Redeploy backend after updating CORS
3. Verify backend is running with health check

### Environment Variables Not Working

**Problem**: Vite variables showing as undefined
**Solution**:
1. Ensure they're set as **Build Variables**, not Runtime Variables
2. Check Dockerfile has `ARG` for each variable
3. Rebuild frontend image with correct build args

### Build Failures

**Problem**: Docker build fails
**Solution**:
1. Check Cloud Build logs
2. Verify all files in .dockerignore are not excluding needed files
3. Ensure Dockerfile paths are correct

### Health Check Failures

**Problem**: Service marked unhealthy
**Solution**:
1. Verify /health endpoint exists
2. Check health check configuration in Dockerfile
3. Review application logs

## Security Best Practices

1. **Never commit secrets to git** - Use Cloud Run environment variables
2. **Use Supabase service role key only on backend** - Use anon key on frontend
3. **Enable authentication** - Add auth to sensitive endpoints
4. **Use HTTPS only** - Cloud Run provides HTTPS automatically
5. **Regularly update dependencies** - Run security scans
6. **Monitor logs for suspicious activity**

## Next Steps

1. Set up custom domain (optional)
2. Configure CDN (optional)
3. Set up error tracking (Sentry, etc.)
4. Add analytics (Google Analytics)
5. Set up backup for Supabase
6. Configure monitoring alerts

## Support

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [GCP Free Tier](https://cloud.google.com/free/docs/free-tier-features)
