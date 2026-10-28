# Brevo Email Setup Guide

## Why Brevo?

Brevo (formerly Sendinblue) is an excellent alternative to Gmail OAuth for email notifications:

### Advantages
- ✅ **No OAuth token expiration issues**
- ✅ **Free tier available** (300 emails/day)
- ✅ **Simple API key authentication**
- ✅ **Better deliverability** than Gmail
- ✅ **Email analytics and tracking**
- ✅ **No daily token regeneration needed**
- ✅ **Production-ready infrastructure**

### Free Tier Limits
- 300 emails per day
- Unlimited contacts
- Basic analytics
- SMTP & API access

## Setup Steps

### Step 1: Create Brevo Account

1. **Sign up at:** https://www.brevo.com
2. **Verify your email address**
3. **Complete account setup**

### Step 2: Get API Key

1. **Login to Brevo dashboard**
2. **Go to:** Account → SMTP & API
3. **Click "Generate a new API key"**
4. **Name it:** "Anarva Clinic Backend"
5. **Copy the API key** (starts with `xkeysib-...`)

### Step 3: Configure Sender Email

1. **In Brevo dashboard, go to:** Senders → Senders
2. **Add your sender email:** anarvaclinic8@gmail.com
3. **Brevo will send a verification email**
4. **Click the verification link** in your Gmail inbox

### Step 4: Update Backend Configuration

**Option A: Add to Render Environment Variables (Recommended)**

1. **Go to Render Dashboard** → Your Service → Environment
2. **Add new variable:**
   - Name: `BREVO_API_KEY`
   - Value: Your Brevo API key (e.g., `xkeysib-abc123...`)
3. **Add optional variable:**
   - Name: `BREVO_SENDER_NAME`
   - Value: `Anarva Clinic`

**Option B: Add to .env file (Local Development)**

```bash
# backend/.env
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_NAME=Anarva Clinic
```

### Step 5: Update Email Service to Use Brevo

**Edit `backend/app/config.py`:**

```python
# Add these lines to Settings class
brevo_api_key: str | None = None
brevo_sender_name: str = "Anarva Clinic"
```

**Edit `backend/app/api/appointments.py`:**

```python
# Change this line:
from app.services import email_notifications, records

# To this:
from app.services import brevo_email, records

# And change:
background_tasks.add_task(email_notifications.notify_appointment_booked, appointment)

# To this:
background_tasks.add_task(brevo_email.notify_appointment_booked_brevo, appointment)
```

**Do the same for patient assessments in `backend/app/api/patients.py`:**

```python
# Change:
from app.services import email_notifications

# To:
from app.services import brevo_email

# And change:
background_tasks.add_task(email_notifications.notify_report_saved, record)

# To:
background_tasks.add_task(brevo_email.notify_report_saved_brevo, record)
```

### Step 6: Test Brevo Email

**Create test script:**

```python
# test_brevo.py
from app.services.brevo_email import _send_brevo_email

_send_brevo_email(
    to_email="anarvaclinic8@gmail.com",
    subject="Brevo Test Email",
    html_content="<h1>This is a test email from Brevo!</h1>"
)
print("Email sent successfully!")
```

**Run it:**
```bash
cd backend
python test_brevo.py
```

### Step 7: Deploy to Render

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Switch to Brevo email service"
   git push origin main
   ```

2. **Render will auto-deploy**

3. **Test by booking an appointment** on the live site

4. **Check Gmail inbox** for the email

## Comparison: Gmail OAuth vs Brevo

| Feature | Gmail OAuth | Brevo |
|---------|-------------|-------|
| Token Expiration | ❌ Expires daily | ✅ No expiration |
| Setup Complexity | ❌ Complex (OAuth flow) | ✅ Simple (API key) |
| Daily Maintenance | ❌ Required | ✅ Not required |
| Free Tier | ❌ Limited | ✅ 300 emails/day |
| Deliverability | ⚠️ Variable | ✅ High |
| Analytics | ❌ Basic | ✅ Advanced |
| Rate Limits | ⚠️ Strict | ✅ Generous |
| Production Ready | ⚠️ Not ideal | ✅ Excellent |

## Brevo Pricing (as of 2026)

- **Free:** 300 emails/day
- **Starter ($25/month):** 10,000 emails/month
- **Pro ($65/month):** 50,000 emails/month
- **Enterprise:** Custom

For a clinic with ~10-20 appointments per day, the free tier is sufficient.

## Troubleshooting

### Error: "Brevo API key not configured"
- Check `BREVO_API_KEY` is set in Render environment variables
- Verify the API key is correct (starts with `xkeysib-`)

### Error: "Sender not verified"
- Go to Brevo → Senders → Verify your sender email
- Click the verification link sent to your Gmail

### Error: "HTTP 401 Unauthorized"
- API key is invalid or expired
- Regenerate API key in Brevo dashboard
- Update Render environment variable

### Error: "HTTP 400 Bad Request"
- Check email format is valid
- Verify sender email is verified in Brevo
- Check HTML content is properly formatted

## Monitoring

### Check Email Status in Admin Panel

1. **Login to admin panel**
2. **Go to System Logs tab**
3. **Look for email operations:**
   - `email_status: "sent"` = Email sent successfully
   - `email_status: "http_error"` = Brevo API error
   - `email_status: "network_error"` = Network issue

### Brevo Dashboard Analytics

1. **Login to Brevo dashboard**
2. **Go to Campaigns → Statistics**
3. **View:**
   - Emails sent
   - Open rate
   - Click rate
   - Bounces
   - Spam complaints

## Migration from Gmail OAuth

### Before Switching
1. **Backup current Gmail token** (if needed)
2. **Test Brevo with test emails**
3. **Verify sender email is verified**

### After Switching
1. **Monitor first few appointment bookings**
2. **Check emails are being received**
3. **Remove Gmail OAuth code** (optional, can keep as backup)

## Quick Start Checklist

- [ ] Create Brevo account
- [ ] Get API key
- [ ] Verify sender email in Brevo
- [ ] Add BREVO_API_KEY to Render
- [ ] Update backend code to use Brevo
- [ ] Test with test email
- [ ] Deploy to Render
- [ ] Book test appointment
- [ ] Verify email received
- [ ] Monitor system logs

## Support

- **Brevo Documentation:** https://developers.brevo.com
- **Brevo Support:** https://help.brevo.com
- **API Reference:** https://developers.brevo.com/reference

## Summary

Brevo is the **recommended solution** for your email notifications because:
- No daily token regeneration needed
- Simple API key authentication
- Free tier sufficient for clinic needs
- Better deliverability than Gmail
- Production-ready infrastructure

Switching to Brevo will eliminate the daily "invalid grant" error permanently.
