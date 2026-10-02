# 🚀 Render Deployment Guide - Step by Step

Complete guide for deploying Anarva Clinic to Render (Free Tier).

## 📋 Prerequisites

Before starting, make sure you have:

1. **Render Account** - Free account at https://render.com
2. **GitHub Account** - With your code pushed
3. **Supabase Project** - Already created with credentials
4. **Gemini API Key** - From Google AI Studio

---

## STEP 1: Test Locally with Docker Compose (Optional but Recommended)

This lets you test everything before deploying to Render.

### 1.1 Create `.env` file in project root

Create a file named `.env` in the root of your project:

```bash
# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Backend (Optional - for local testing)
SECRET_KEY=dev-secret-key
DOCTOR_USERNAME=doctor
DOCTOR_PASSWORD=doctor123
```

### 1.2 Start services

```bash
# Start backend and frontend
docker-compose up --build

# Access:
# Backend: http://localhost:3000
# Frontend: http://localhost:8080
# Health checks:
# Backend: http://localhost:3000/health
# Frontend: http://localhost:8080/health
```

### 1.3 Test the application

1. Open http://localhost:8080 in browser
2. Try the quiz flow
3. Upload photos
4. Check if everything works

### 1.4 Stop services

```bash
docker-compose down
```

---

## STEP 2: Deploy Backend to Render

### 2.1 Go to Render Dashboard

1. Go to https://dashboard.render.com
2. Click "New +"
3. Select "Web Service"

### 2.2 Connect GitHub

1. Click "Connect GitHub"
2. Authorize Render to access your GitHub
3. Select repository: `shrikantha123/anarva-clinic`
4. Select branch: `main`

### 2.3 Configure Backend Service

**Name**: `anarva-backend`

**Root Directory**: `backend`

**Runtime**: Docker

**Dockerfile Path**: `Dockerfile`

**Instance Type**: Free

**Region**: Choose closest to you (e.g., Oregon)

### 2.4 Add Environment Variables

Add these in the "Environment" section:

```bash
ENVIRONMENT=production
SECRET_KEY=generate-a-random-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
DOCTOR_USERNAME=doctor
DOCTOR_PASSWORD=your-secure-password
GEMINI_MODEL=gemini-2.5-flash
AI_TIMEOUT_SECONDS=60
```

**Tip**: Generate SECRET_KEY with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.5 Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. You'll see logs in the "Logs" tab
4. When deployment completes, you'll get a URL like:
   `https://anarva-backend-xxxx.onrender.com`

### 2.6 Test Backend Health

Open your browser and go to:
```
https://your-backend-url.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": 1234567890.123,
  "service": "anarva-backend"
}
```

**Copy this backend URL** - you'll need it for frontend.

---

## STEP 3: Deploy Frontend to Render

### 3.1 Create New Web Service

1. Go to Render Dashboard
2. Click "New +"
3. Select "Web Service"

### 3.2 Connect GitHub

1. Select same repository: `shrikantha123/anarva-clinic`
2. Select branch: `main`

### 3.3 Configure Frontend Service

**Name**: `anarva-frontend`

**Root Directory**: `frontend`

**Runtime**: Docker

**Dockerfile Path**: `Dockerfile`

**Instance Type**: Free

**Region**: Same as backend (important!)

### 3.4 Add BUILD ARGUMENTS (Not Environment Variables!)

⚠️ **IMPORTANT**: These are BUILD ARGUMENTS, not environment variables!

In the "Advanced" section, find "Build Args" and add:

```bash
VITE_API_URL=https://your-backend-url-onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: Use your actual backend URL from Step 2.

### 3.5 Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Check logs in "Logs" tab
4. When done, you'll get a URL like:
   `https://anarva-frontend-xxxx.onrender.com`

### 3.6 Test Frontend Health

Open your browser and go to:
```
https://your-frontend-url.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "anarva-frontend"
}
```

**Copy this frontend URL** - you'll need it for CORS update.

---

## STEP 4: Update CORS in Backend

Now you need to tell the backend to allow requests from your frontend.

### 4.1 Open your code

Open file: `backend/app/main.py`

### 4.2 Find CORS section

Look for `app.add_middleware(CORSMiddleware, ...)` around line 170-180.

### 4.3 Update allow_origins

Replace these lines:
```python
"https://YOUR_FRONTEND_RENDER_URL.onrender.com",
"https://YOUR_BACKEND_RENDER_URL.onrender.com",
```

With your actual URLs:
```python
"https://anarva-frontend-xxxx.onrender.com",
"https://anarva-backend-xxxx.onrender.com",
```

### 4.4 Commit and push

```bash
git add backend/app/main.py
git commit -m "Update CORS with Render URLs"
git push origin main
```

### 4.5 Wait for auto-redeploy

Render will automatically redeploy backend when you push.
Wait 5-10 minutes for the deployment to complete.

---

## STEP 5: Set Up Cron Job for Health Monitoring (Every 5 Minutes)

Render provides free cron jobs for health monitoring.

### 5.1 Create Cron Job

1. Go to Render Dashboard
2. Click "New +"
3. Select "Cron Job"

### 5.2 Configure Cron Job

**Name**: `backend-health-check`

**Command**: `curl https://your-backend-url.onrender.com/health`

**Schedule**: `*/5 * * * *` (Every 5 minutes)

**Region**: Same as backend

### 5.3 Create Cron Job

1. Click "Create Cron Job"
2. This will ping your backend every 5 minutes
3. If it fails, you'll get an email notification

---

## STEP 6: Test Your Deployed Application

### 6.1 Test Frontend

1. Open your frontend URL in browser:
   `https://anarva-frontend-xxxx.onrender.com`
2. The Anarva Clinic website should load
3. Try the quiz flow
4. Upload photos
5. Submit the form

### 6.2 Check for CORS Errors

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try the quiz
4. Look for API calls to backend
5. Check if there are any CORS errors

### 6.3 Test Backend API

1. Open backend health endpoint:
   `https://anarva-backend-xxxx.onrender.com/health`
2. Should return healthy status
3. Check backend logs in Render dashboard

---

## STEP 7: Configure Auto-Deploy (Already Done by Default)

Render automatically deploys when you push to GitHub.

To verify:

1. Go to your service in Render Dashboard
2. Click "Settings"
3. Check "Auto-Deploy" is enabled
4. It should be on by default

### Test Auto-Deploy

1. Make a small change to your code
2. Commit and push to GitHub
3. Watch Render logs
4. Service should automatically redeploy

---

## 🎯 Summary of URLs

After deployment, you'll have:

- **Frontend**: `https://anarva-frontend-xxxx.onrender.com`
- **Backend**: `https://anarva-backend-xxxx.onrender.com`
- **Health Backend**: `https://anarva-backend-xxxx.onrender.com/health`
- **Health Frontend**: `https://anarva-frontend-xxxx.onrender.com/health`

---

## 🔧 Troubleshooting

### Problem: "Build failed"

**Solution**:
- Check Render logs for specific error
- Verify Dockerfile paths are correct
- Make sure all files are in right folders
- Check that .dockerignore isn't excluding needed files

### Problem: "CORS error in browser"

**Solution**:
- Make sure you updated CORS in backend
- Redeploy backend after CORS update
- Verify both URLs are correct (no typos)
- Check that frontend URL uses https://

### Problem: "Environment variables not working"

**Solution**:
- Backend: Check they're in "Environment" section
- Frontend: Check they're in "Build Args" section (NOT Environment)
- For frontend, variables MUST be build-time
- Verify variable names match exactly

### Problem: "Service not responding"

**Solution**:
- Check service logs in Render dashboard
- Verify health check endpoint exists
- Make sure port is correct (10000 for Render)
- Check if service is sleeping (free tier)

### Problem: "Service takes too long to start"

**Solution**:
- Free tier services can take 30-60 seconds to wake up
- This is normal for cold starts
- Consider upgrading to paid tier for instant wake-up

---

## 💰 Free Tier Limits

Render free tier includes:

- **750 hours** of runtime per month
- **100 GB** of bandwidth per month
- **Unlimited** private repositories
- **SSL certificates** included
- **Auto-deploys** from GitHub

To stay within limits:

- Set both services to free tier
- Minimize usage during testing
- Monitor bandwidth in dashboard
- Scale to zero when not in use (automatic on free tier)

---

## 📊 Monitoring

### View Logs

1. Go to Render Dashboard
2. Click on your service
3. Click "Logs" tab
4. View real-time logs

### Check Metrics

1. Go to Render Dashboard
2. Click on your service
3. Click "Metrics" tab
4. View CPU, memory, and response time

### Health Check Cron

The cron job you set up will:
- Ping backend every 5 minutes
- Send email if health check fails
- Keep track of uptime

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
2. **Use Supabase service role key only on backend**
3. **Use Supabase anon key on frontend**
4. **Keep secrets in Render environment variables**
5. **Use strong passwords for doctor account**
6. **Enable SSL** (automatic on Render)
7. **Monitor logs for suspicious activity**

---

## ✅ Deployment Checklist

Before pushing to GitHub:

- [ ] Tested locally with docker-compose
- [ ] Backend deployed to Render successfully
- [ ] Frontend deployed to Render successfully
- [ ] CORS updated with actual Render URLs
- [ ] Backend redeployed after CORS update
- [ ] Health endpoints working on both services
- [ ] No CORS errors in browser
- [ ] Quiz flow working end-to-end
- [ ] Photo upload working
- [ ] Cron job configured for health checks
- [ ] Auto-deploy enabled
- [ ] All secrets in Render environment variables

---

## 🎉 You're Done!

Your app is now live on Render free tier!

**Frontend URL**: `https://anarva-frontend-xxxx.onrender.com`
**Backend URL**: `https://anarva-backend-xxxx.onrender.com`

Share these URLs with your users!

---

## 📞 Next Steps

1. **Set up custom domain** (optional)
2. **Configure error tracking** (Sentry, etc.)
3. **Add analytics** (Google Analytics)
4. **Set up backup for Supabase**
5. **Monitor usage in Render dashboard**
6. **Consider upgrading to paid tier** if needed

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Free Tier**: https://render.com/docs/free
- **Docker Docs**: https://docs.docker.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
