# Why Gmail Token Expires Every Day - Root Cause & Solution

## The Problem

Your Gmail OAuth token expires daily because of how Render environment variables work.

## Root Cause

### How Gmail OAuth Works

1. **Initial Authorization** (`python -m app.gmail_auth`):
   - Creates an access token (expires in 1 hour)
   - Creates a refresh token (long-lived, should last indefinitely)
   - Saves both to `gmail-token.json`

2. **Token Usage**:
   - Access token is used to send emails
   - When access token expires, refresh token is used to get a new access token
   - This should happen automatically without user intervention

### Why It Fails on Render

**The Issue:**
- You copy the token JSON to Render's `GMAIL_TOKEN_JSON` environment variable
- When the access token expires, the code tries to refresh it
- The refresh succeeds and gets a new access token
- **BUT** the new token cannot be saved back to Render's environment variable
- Environment variables on Render are **static** - they can't be updated at runtime
- Next time the app restarts or uses the token, it loads the old expired token from env var

**Visual Explanation:**
```
Local Machine:
gmail-token.json (has refresh_token)
  ↓ Copy to Render
Render Env Var: GMAIL_TOKEN_JSON (has refresh_token)
  ↓ Token expires after 1 hour
Code tries to refresh → Success
  ↓ But cannot save back to env var!
Next request → Loads old expired token from env var
  ↓ Error: "invalid grant"
```

## Why It Happens "Every Day"

1. **Access token expires in 1 hour**
2. **Refresh token should work indefinitely**, but:
   - If the initial authorization didn't properly request offline access
   - If Google revoked the refresh token (security reasons)
   - If the token was copied without the `refresh_token` field

3. **Render's static environment variables** prevent automatic token persistence

## Permanent Solutions

### Solution 1: Use Render Disk Storage (Recommended)

Instead of storing the token in an environment variable, store it in Render's persistent disk:

1. **Create a secrets directory in your app:**
   ```bash
   mkdir -p backend/secrets
   ```

2. **Upload `gmail-token.json` to Render's disk:**
   - Use Render's disk storage or a file upload mechanism
   - Or use a cloud storage service (Supabase storage, S3, etc.)

3. **Update code to read from file instead of env var:**
   - The code already falls back to file-based tokens
   - Just ensure the file exists on Render

### Solution 2: Use Supabase Storage for Token

Store the Gmail token in Supabase (which you're already using):

1. **Create a table in Supabase:**
   ```sql
   CREATE TABLE gmail_tokens (
     id SERIAL PRIMARY KEY,
     token_data JSONB NOT NULL,
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Update email code to:**
   - Read token from Supabase
   - Refresh if needed
   - Save refreshed token back to Supabase

3. **This allows dynamic token updates**

### Solution 3: Switch to SMTP with App Password (Simplest)

Skip OAuth entirely and use Gmail SMTP with an App Password:

1. **Enable 2FA on Google account**
2. **Generate App Password** (Google Account → Security → App Passwords)
3. **Update email sending code to use SMTP:**
   ```python
   import smtplib
   from email.message import EmailMessage
   
   def send_email_smtp(subject, body):
       msg = EmailMessage()
       msg['To'] = settings.gmail_notification_email
       msg['From'] = settings.gmail_sender_email
       msg['Subject'] = subject
       msg.set_content(body)
       
       with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
           smtp.login(settings.gmail_sender_email, settings.gmail_app_password)
           smtp.send_message(msg)
   ```

4. **Set `GMAIL_APP_PASSWORD` in Render environment variables**

**Advantages:**
- No OAuth token expiration issues
- Simple to configure
- Works indefinitely

**Disadvantages:**
- Less secure than OAuth (but still secure with App Password)
- Google may deprecate App Passwords in the future

### Solution 4: Use a Transactional Email Service (Best for Production)

Use a dedicated email service like:
- SendGrid
- Mailgun
- AWS SES
- Resend

**Advantages:**
- No OAuth issues
- Better deliverability
- Analytics and tracking
- Higher rate limits
- Professional email infrastructure

**Example with Resend (Free tier available):**
```python
import resend

resend.api_key = "your-resend-api-key"

def send_email_resend(subject, body):
    resend.Emails.send({
        "from": settings.gmail_sender_email,
        "to": settings.gmail_notification_email,
        "subject": subject,
        "html": body
    })
```

## Quick Fix for Now

While you decide on a permanent solution:

1. **Regenerate token daily** (temporary workaround):
   ```bash
   cd backend
   python -m app.gmail_auth
   # Copy token to Render
   ```

2. **Or switch to SMTP App Password** (easiest immediate fix):
   - Generate App Password from Google
   - Update code to use SMTP
   - Set `GMAIL_APP_PASSWORD` in Render

## Recommendation

**For immediate fix:** Switch to SMTP with App Password (Solution 3)

**For long-term:** Use a transactional email service like Resend or SendGrid (Solution 4)

This will eliminate OAuth token issues entirely and provide a more reliable email infrastructure.
