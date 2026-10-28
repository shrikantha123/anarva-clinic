# Gmail OAuth Token Fix - Invalid Grant Error

## Problem
You're seeing "refresh token invalid grant" error. This means the Gmail OAuth token has expired or been revoked.

## Solution: Regenerate Gmail Token

### Step 1: Regenerate Token Locally

1. **Navigate to backend directory:**
   ```bash
   cd C:\Users\SRIKANTHA\CascadeProjects\anarva-clinic\backend
   ```

2. **Run the Gmail authorization script:**
   ```bash
   python -m app.gmail_auth
   ```

3. **This will:**
   - Open a browser window
   - Ask you to login to your Google account (anarvaclinic8@gmail.com)
   - Ask for permission to send emails
   - Save the new token to `backend/secrets/gmail-token.json`

### Step 2: Update Render Environment Variable

1. **Read the new token:**
   ```bash
   type backend\secrets\gmail-token.json
   ```

2. **Copy the entire JSON content**

3. **Go to Render Dashboard:**
   - https://dashboard.render.com
   - Select your service (anarva-clinic)
   - Go to "Environment" section

4. **Update GMAIL_TOKEN_JSON:**
   - Find existing `GMAIL_TOKEN_JSON` variable
   - Paste the new JSON content
   - Click "Save Changes"

5. **Render will automatically restart** the service with the new token

### Step 3: Verify Email is Working

1. **Book a test appointment** through the website
2. **Check system logs** in admin panel:
   - Login: https://anarvaclinic.com/hair-loss-assessment/?doctor
   - Go to "System Logs" tab
   - Look for email_status: "sent" (not "token_expired")

3. **Check Gmail inbox** at anarvaclinic8@gmail.com

## Why This Happens

Gmail OAuth tokens can expire or become invalid due to:
- Token expiration (typically after 7 days if not used)
- Password change on Google account
- Security settings changed in Google account
- Token revoked from Google account settings

## Prevention

To prevent frequent token expiration:
- Keep using the email service regularly
- Don't change Google account password frequently
- Ensure "Less secure app access" is not blocking OAuth
- Check Google account security settings

## Alternative: Use App Password (Less Secure)

If OAuth continues to fail, you can switch to App Password:

1. **Enable 2FA on Google account:**
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable it

2. **Generate App Password:**
   - Security → App Passwords
   - Create new app password for "Mail"
   - Copy the 16-character password

3. **Update email sending code** to use SMTP with App Password instead of OAuth

## Quick Test After Fix

Run the email test script:
```bash
cd backend
python test_email.py
```

This will book a test appointment and you can check if email is sent.

## Current Status

The system now detects "invalid grant" errors and logs them as:
- **email_status: "token_expired"**
- **error_details: "OAuth token expired/invalid. Regenerate token: python -m app.gmail_auth"**

This makes it easy to identify the issue in system logs.
