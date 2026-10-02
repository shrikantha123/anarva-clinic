# 🚀 Easy Step-by-Step Deployment Guide

Follow these simple steps to deploy your app to Google Cloud Run (Free Tier).

## Prerequisites (Do this first)

1. **Create a Google Cloud Account**
   - Go to https://console.cloud.google.com
   - Sign up (you'll need a credit card, but won't be charged for free tier)
   - Create a new project or use existing one

2. **Enable Required APIs**
   - Go to: https://console.cloud.google.com/apis/library
   - Search and enable:
     - "Cloud Run API"
     - "Cloud Build API"
     - "Artifact Registry API"

3. **Install gcloud CLI** (Optional - for command line deployment)
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use the web console (easier for beginners)

---

## STEP 1: Deploy Backend (FastAPI)

### Option A: Using Web Console (Easiest)

1. **Go to Cloud Run**
   - Visit: https://console.cloud.google.com/run
   - Click "Create Service"

2. **Configure Container Source**
   - Click "Deploy from GitHub repository"
   - Click "Set up with Cloud Build" (first time only)
   - Authorize Google to access your GitHub
   - Select repository: `shrikantha123/anarva-clinic`
   - Select branch: `main`
   - **Context Directory**: Type `backend`
   - **Dockerfile**: Type `Dockerfile`
   - Click "Next"

3. **Configure Service Settings**
   - **Service name**: Type `anarva-backend`
   - **Region**: Select `us-central1` (or nearest to you)
   - Click "Next"

4. **Configure Container**
   - **Port**: Type `8080`
   - **CPU Allocation**: Select "CPU is only allocated during request processing"
   - **Max instances**: Type `1`
   - **Min instances**: Type `0`
   - **Memory**: Select `512 MiB`
   - Click "Next"

5. **Add Environment Variables** (IMPORTANT!)
   Scroll to "Variables & Secrets" section
   Click "Add Variable" and add these:

   ```
   Name: ENVIRONMENT
   Value: production

   Name: SECRET_KEY
   Value: (generate a random key - use: python -c "import secrets; print(secrets.token_urlsafe(32))")

   Name: SUPABASE_URL
   Value: https://your-project.supabase.co

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: (your Supabase service role key from dashboard)

   Name: GEMINI_API_KEY
   Value: (your Gemini API key from Google AI Studio)

   Name: DOCTOR_USERNAME
   Value: doctor

   Name: DOCTOR_PASSWORD
   Value: (choose a strong password)
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for deployment
   - You'll see a green checkmark when done

7. **Copy Backend URL**
   - After deployment, you'll see a URL like:
     `https://anarva-backend-xxxxx-xxxx.a.run.app`
   - **Copy this URL** - you'll need it for frontend

---

## STEP 2: Deploy Frontend (React)

### Option A: Using Web Console (Easiest)

1. **Go to Cloud Run**
   - Visit: https://console.cloud.google.com/run
   - Click "Create Service"

2. **Configure Container Source**
   - Click "Deploy from GitHub repository"
   - Select repository: `shrikantha123/anarva-clinic`
   - Select branch: `main`
   - **Context Directory**: Type `frontend`
   - **Dockerfile**: Type `Dockerfile`
   - Click "Next"

3. **Configure Service Settings**
   - **Service name**: Type `anarva-frontend`
   - **Region**: Select `us-central1` (same as backend)
   - Click "Next"

4. **Configure Container**
   - **Port**: Type `8080`
   - **CPU Allocation**: Select "CPU is only allocated during request processing"
   - **Max instances**: Type `1`
   - **Min instances**: Type `0`
   - **Memory**: Select `512 MiB`
   - Click "Next"

5. **Add BUILD VARIABLES** (NOT Runtime Variables!)
   ⚠️ **IMPORTANT**: These are BUILD variables, not environment variables!
   Scroll to "Build Variables" section (different from Variables & Secrets)
   Click "Add Variable" and add these:

   ```
   Name: VITE_API_URL
   Value: https://your-backend-url-from-step-1.a.run.app

   Name: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co

   Name: VITE_SUPABASE_ANON_KEY
   Value: (your Supabase anon key from dashboard)
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for deployment
   - You'll see a green checkmark when done

7. **Copy Frontend URL**
   - After deployment, you'll see a URL like:
     `https://anarva-frontend-xxxxx-xxxx.a.run.app`
   - **Copy this URL** - you'll need it for CORS update

---

## STEP 3: Update CORS in Backend

Now you need to tell the backend to allow requests from your frontend.

1. **Open your code editor**
   - Open file: `backend/app/main.py`

2. **Find the CORS section**
   - Look for `app.add_middleware(CORSMiddleware, ...)`
   - Around line 170-180

3. **Update the allow_origins**
   Replace this line:
   ```python
   "https://YOUR_FRONTEND_CLOUD_RUN_URL.cloudrun.app",
   ```
   With your actual frontend URL:
   ```python
   "https://anarva-frontend-xxxxx-xxxx.a.run.app",
   ```

   It should look like:
   ```python
   allow_origins=[
       "https://anarva-frontend-xxxxx-xxxx.a.run.app",  # Your actual frontend URL
       "https://anarva-backend-xxxxx-xxxx.a.run.app",   # Your backend URL
       "http://localhost:5173",
       "http://localhost:3000",
   ],
   ```

4. **Commit and push changes**
   ```bash
   git add backend/app/main.py
   git commit -m "Update CORS with frontend URL"
   git push origin main
   ```

5. **Redeploy Backend**
   - Go to Cloud Run console
   - Click on `anarva-backend` service
   - Click "Edit & Deploy New Revision"
   - Click "Deploy" (no changes needed, just to redeploy)
   - Wait for deployment to complete

---

## STEP 4: Test Your Deployment

### Test Backend Health
1. Open your browser
2. Go to: `https://your-backend-url.a.run.app/health`
3. You should see:
   ```json
   {
     "status": "healthy",
     "uptime": 123.45
   }
   ```

### Test Frontend
1. Open your browser
2. Go to: `https://your-frontend-url.a.run.app`
3. The Anarva Clinic website should load
4. Try the quiz flow
5. Check browser console (F12) for errors

### Test API Connection
1. On the frontend, try the hair loss assessment quiz
2. Upload photos
3. Submit the form
4. Check if it works (no CORS errors in console)

---

## STEP 5: Set Up Automatic Deployments (Optional but Recommended)

This means every time you push code to GitHub, it automatically deploys.

### Using Cloud Run's Built-in GitHub Integration

1. **For Backend**
   - Go to Cloud Run console
   - Click on `anarva-backend` service
   - Click "Edit & Deploy New Revision"
   - Click "Continuous Deployment" tab
   - Click "Set up continuous deployment"
   - Follow instructions to connect GitHub
   - Configure:
     - Repository: `shrikantha123/anarva-clinic`
     - Branch: `main`
     - Build Type: Dockerfile
     - Context Directory: `/backend`
     - Dockerfile: `Dockerfile`
   - Click "Save"

2. **For Frontend**
   - Repeat the same steps for `anarva-frontend`
   - Context Directory: `/frontend`

3. **Test It**
   - Make a small change to your code
   - Commit and push to GitHub
   - Watch Cloud Build logs
   - Service should automatically redeploy

---

## 🔧 Troubleshooting

### Problem: "Build failed"
**Solution**:
- Check Cloud Build logs for errors
- Make sure Dockerfile paths are correct
- Verify all files are in the right folders

### Problem: "CORS error in browser"
**Solution**:
- Make sure you updated CORS in backend with your frontend URL
- Redeploy backend after CORS update
- Check that both URLs are correct (no typos)

### Problem: "Environment variables not working"
**Solution**:
- Backend: Check they're in "Variables & Secrets" section
- Frontend: Check they're in "Build Variables" section (NOT runtime)
- For frontend, variables MUST be build-time

### Problem: "Service not responding"
**Solution**:
- Check service logs in Cloud Run console
- Verify health check endpoint exists
- Make sure port is 8080

### Problem: "Free tier limit exceeded"
**Solution**:
- Check your Cloud Run metrics
- Reduce max instances to 1
- Set min instances to 0
- Choose a different region

---

## 💰 Staying Within Free Tier

To avoid charges, make sure:

✅ **CPU**: "CPU is only allocated during request processing"
✅ **Max instances**: 1
✅ **Min instances**: 0 (scales to zero when idle)
✅ **Memory**: 512 MiB
✅ **Region**: us-central1 or similar

Free tier includes:
- 2 million requests per month
- 200,000 GB-seconds of compute
- 1 GB network egress per day

---

## 📞 Need Help?

- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Cloud Build Docs**: https://cloud.google.com/build/docs
- **GCP Free Tier**: https://cloud.google.com/free/docs/free-tier-features

---

## ✅ Checklist Before Deploying

- [ ] Google Cloud account created
- [ ] Required APIs enabled (Cloud Run, Cloud Build, Artifact Registry)
- [ ] Supabase project created
- [ ] Supabase credentials ready (URL, service role key, anon key)
- [ ] Gemini API key ready
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] CORS updated in backend
- [ ] Backend redeployed after CORS update
- [ ] Frontend URL working in browser
- [ ] API calls working (no CORS errors)
- [ ] Health check endpoint responding

---

## 🎉 You're Done!

Your app is now live on Google Cloud Run free tier!

- **Frontend URL**: `https://anarva-frontend-xxxxx-xxxx.a.run.app`
- **Backend URL**: `https://anarva-backend-xxxxx-xxxx.a.run.app`

Share these URLs with your users!
