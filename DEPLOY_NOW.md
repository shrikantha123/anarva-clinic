# 🚀 Render Deployment - Step by Step Right Now

Follow these exact steps to deploy to Render.

---

## PREPARATION (5 minutes)

### Step 1: Get Your Credentials Ready

You'll need these values (get them from your Supabase and Google AI Studio):

**Supabase** (from https://supabase.com/dashboard):
- Project URL: `https://xxxxx.supabase.co`
- Service Role Key: (from Settings → API)
- Anon Key: (from Settings → API)

**Gemini API** (from https://aistudio.google.com/app/apikey):
- API Key: `AIza...`

**Doctor Credentials** (choose your own):
- Username: `doctor`
- Password: `YourSecurePassword123`

---

## DEPLOY BACKEND (10 minutes)

### Step 2: Create Render Account

1. Go to https://render.com
2. Click "Sign Up" (it's free)
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your GitHub

### Step 3: Deploy Backend

1. After signing up, you'll see the dashboard
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

### Step 4: Connect GitHub

1. Click **"Connect GitHub"**
2. Click **"Authorize Render"** on GitHub
3. Select repository: **shrikantha123/anarva-clinic**
4. Select branch: **main**
5. Click **"Connect"**

### Step 5: Configure Backend Service

Fill in these fields exactly:

**Name**: `anarva-backend`

**Root Directory**: `backend`

**Runtime**: **Docker**

**Dockerfile Path**: `Dockerfile`

**Instance Type**: **Free**

**Region**: Select **Oregon (us-west)** or **Frankfurt (eu-central)** (whichever is closer to you)

Click **"Next"**

### Step 6: Add Environment Variables

Scroll down to **"Environment"** section
Click **"Add Variable"** for each of these:

```
Variable 1:
  Name: ENVIRONMENT
  Value: production

Variable 2:
  Name: SECRET_KEY
  Value: generate-random-key (use: python -c "import secrets; print(secrets.token_urlsafe(32))")

Variable 3:
  Name: SUPABASE_URL
  Value: https://your-project.supabase.co

Variable 4:
  Name: SUPABASE_SERVICE_ROLE_KEY
  Value: your-service-role-key-from-supabase

Variable 5:
  Name: GEMINI_API_KEY
  Value: your-gemini-api-key

Variable 6:
  Name: DOCTOR_USERNAME
  Value: doctor

Variable 7:
  Name: DOCTOR_PASSWORD
  Value: YourSecurePassword123

Variable 8:
  Name: GEMINI_MODEL
  Value: gemini-2.5-flash

Variable 9:
  Name: AI_TIMEOUT_SECONDS
  Value: 60
```

### Step 7: Deploy Backend

1. Click **"Create Web Service"** (bottom right)
2. Wait 5-10 minutes (watch the logs)
3. When done, you'll see a green checkmark
4. Copy the backend URL (looks like: `https://anarva-backend-xxxx.onrender.com`)

**IMPORTANT**: Save this backend URL somewhere - you'll need it!

---

## DEPLOY FRONTEND (10 minutes)

### Step 8: Create Frontend Service

1. Go back to Render Dashboard
2. Click **"New +"**
3. Select **"Web Service"**

### Step 9: Connect GitHub (Again)

1. Select same repository: **shrikantha123/anarva-clinic**
2. Select branch: **main**
3. Click **"Connect"**

### Step 10: Configure Frontend Service

Fill in these fields:

**Name**: `anarva-frontend`

**Root Directory**: `frontend`

**Runtime**: **Docker**

**Dockerfile Path**: `Dockerfile`

**Instance Type**: **Free**

**Region**: **Same as backend** (important!)

Click **"Next"**

### Step 11: Add BUILD ARGUMENTS (Critical!)

⚠️ **IMPORTANT**: These are BUILD ARGUMENTS, not environment variables!

Scroll down to **"Advanced"** section
Find **"Build Args"**
Click **"Add Variable"** for each:

```
Build Arg 1:
  Name: VITE_API_URL
  Value: https://your-backend-url-from-step-7.onrender.com

Build Arg 2:
  Name: VITE_SUPABASE_URL
  Value: https://your-project.supabase.co

Build Arg 3:
  Name: VITE_SUPABASE_ANON_KEY
  Value: your-anon-key-from-supabase
```

**Note**: Use your actual backend URL from Step 7!

### Step 12: Deploy Frontend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes
3. When done, copy the frontend URL (looks like: `https://anarva-frontend-xxxx.onrender.com`)

---

## UPDATE CORS (5 minutes)

### Step 13: Update CORS in Backend

1. Open your code editor
2. Open file: `backend/app/main.py`
3. Find line around 174-180 (CORS middleware)
4. Replace these lines:

```python
"https://YOUR_FRONTEND_RENDER_URL.onrender.com",
"https://YOUR_BACKEND_RENDER_URL.onrender.com",
```

With your actual URLs:

```python
"https://anarva-frontend-xxxx.onrender.com",
"https://anarva-backend-xxxx.onrender.com",
```

### Step 14: Push Changes

```bash
cd C:\Users\SRIKANTHA\Desktop\anarva-clinic
git add backend/app/main.py
git commit -m "Update CORS with Render URLs"
git push origin main
```

### Step 15: Wait for Auto-Redeploy

Render will automatically redeploy backend.
Wait 5-10 minutes.

---

## SET UP CRON JOB (3 minutes)

### Step 16: Create Health Check Cron

1. Go to Render Dashboard
2. Click **"New +"**
3. Select **"Cron Job"**

### Step 17: Configure Cron Job

**Name**: `backend-health-check`

**Command**: `curl https://your-backend-url.onrender.com/health`

**Schedule**: `*/5 * * * *` (Every 5 minutes)

**Region**: Same as backend

Click **"Create Cron Job"**

---

## TEST DEPLOYMENT (5 minutes)

### Step 18: Test Backend Health

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

### Step 19: Test Frontend

Open your browser and go to:
```
https://your-frontend-url.onrender.com
```

1. The Anarva Clinic website should load
2. Try the quiz flow
3. Upload photos
4. Submit the form

### Step 20: Check for Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any errors
4. Go to **Network** tab
5. Check if API calls succeed (no CORS errors)

---

## ✅ YOU'RE DONE!

Your app is now live on Render free tier!

**Frontend URL**: `https://anarva-frontend-xxxx.onrender.com`
**Backend URL**: `https://anarva-backend-xxxx.onrender.com`

Share these URLs with your users!

---

## 🆘 If Something Goes Wrong

### Problem: Build failed
**Solution**: Check the logs in Render dashboard for the specific error

### Problem: CORS error
**Solution**: Make sure you updated CORS in backend and redeployed

### Problem: Environment variables not working
**Solution**: 
- Backend: Check they're in "Environment" section
- Frontend: Check they're in "Build Args" section (NOT Environment)

### Problem: Service not responding
**Solution**: Check service logs, verify health endpoint works

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Your Dashboard**: https://dashboard.render.com
- **GitHub Repo**: https://github.com/shrikantha123/anarva-clinic

---

## 🎯 Quick Checklist

- [ ] Render account created
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] CORS updated with actual URLs
- [ ] Backend redeployed after CORS update
- [ ] Health endpoints working
- [ ] Quiz flow working
- [ ] No CORS errors
- [ ] Cron job configured

---

**Start with Step 2! 🚀**
