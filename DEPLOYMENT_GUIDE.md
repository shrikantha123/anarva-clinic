# Anarva Clinic - Deployment Guide

## Summary of Changes Made

### 1. Fixed Date Validation Error (Status 422)
**File:** `backend/app/schemas/records.py`
- Changed `date` field from `dt.date` to `str` type
- Added validator to accept both date objects and ISO format strings (YYYY-MM-DD)
- Validates date is not in the past
- Returns consistent ISO string format

### 2. Configured CORS for All Domains
**File:** `backend/app/main.py`
- Changed `allow_origins` to `["*"]` to accept requests from any domain
- Allows frontend on `anarvaclinic.com` to communicate with backend on `onrender.com`

### 3. Enhanced Email Error Handling
**File:** `backend/app/services/email_notifications.py`
- Separated error handling for configuration errors vs network/API errors
- Logs errors without crashing the application
- Email failures no longer prevent appointment booking from succeeding

### 4. Comprehensive Frontend Validation
**File:** `frontend/site/script.js`
- Added client-side validation for all required fields
- Improved error parsing from server responses
- User-friendly error messages with specific guidance

### 5. Added Field Validators
**File:** `backend/app/schemas/records.py`
- Added validator for `patient_name` and `time_slot` to prevent empty strings
- Added minimum length validation for `patient_phone` (10 digits)

## Deployment Steps

### Backend Deployment (onrender.com)

1. **Push changes to GitHub**
   ```bash
   cd C:\Users\SRIKANTHA\CascadeProjects\anarva-clinic
   git add .
   git commit -m "Fix appointment booking date validation and enhance error handling"
   git push origin main
   ```

2. **Render will auto-deploy**
   - Render automatically detects the push and deploys
   - Monitor deployment at: https://dashboard.render.com

3. **Verify Environment Variables**
   Ensure these are set in Render:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `DOCTOR_USERNAME`
   - `DOCTOR_PASSWORD`
   - `GMAIL_TOKEN_JSON` (for email notifications)

### Frontend Deployment (anarvaclinic.com)

1. **Deploy updated files**
   - Upload `frontend/site/` directory to your hosting
   - Ensure `test-booking.html` is accessible at `anarvaclinic.com/test-booking.html`

2. **Update booking form**
   - The main booking form in `index.html` uses the updated `script.js`
   - No changes needed to HTML structure

## Testing Instructions

### Backend API Testing

Run the test script:
```bash
cd backend
python test_appointment_booking.py
```

**Test Results (Current):**
- ✅ Valid appointment (future date) - PASS
- ✅ Invalid appointment (past date) - PASS
- ✅ Valid appointment with email in notes - PASS
- ⚠️ Missing patient name - FAIL (needs deployment)
- ✅ Special characters in name - PASS
- ✅ Long notes field - PASS
- ✅ Phone without + prefix - PASS
- ✅ Invalid date format - PASS
- ✅ Today's date - PASS
- ⚠️ Empty time slot - FAIL (needs deployment)

**Note:** The 2 failing tests will pass after deploying the updated backend code with the new field validators.

### Frontend Device Testing

1. **Open test page on different devices:**
   - Desktop (Chrome, Firefox, Safari, Edge)
   - Mobile iOS (Safari, Chrome)
   - Mobile Android (Chrome, Firefox)
   - Tablet (iPad, Android tablets)

   URL: `https://anarvaclinic.com/test-booking.html`

2. **Test scenarios using the test buttons:**
   - ✅ Fill Valid Data - Should succeed
   - ❌ Past Date - Should show validation error
   - ❌ Invalid Email - Should show validation error
   - ❌ Invalid Phone - Should show validation error
   - ❌ Empty Fields - Should show validation error
   - ✅ Special Chars - Should succeed

3. **Check device info displayed:**
   - User Agent
   - Screen resolution
   - Viewport size

### Email Notification Testing

1. **Book a test appointment** through the form
2. **Check email logs** in the admin panel:
   - Login to doctor panel: `anarvaclinic.com/hair-loss-assessment/?doctor`
   - Go to "System Logs" tab
   - Look for email operation status
   - Status should be "sent" or "config_error" if not configured

3. **Verify email received:**
   - Check the clinic's Gmail inbox
   - Look for subject: `[Anarva Clinic] Appointment Booked: APT-XXXX-26`

## Error Handling Verification

### Frontend Error Messages
- Empty name: "Please enter your full name."
- Invalid email: "Please enter a valid email address."
- Invalid phone: "Please enter a valid phone number (10-15 digits)."
- Past date: "Appointment date cannot be in the past."
- Empty time slot: "Please select a preferred time slot."
- Server error: Shows detailed error message from backend

### Backend Error Responses
- 422 status for validation errors
- JSON response with `error` and `fields` keys
- Detailed error messages in logs

## Admin Panel Verification

1. **Access doctor panel:**
   URL: `https://anarvaclinic.com/hair-loss-assessment/?doctor`

2. **Login with credentials:**
   - Username: Set in `DOCTOR_USERNAME` env var
   - Password: Set in `DOCTOR_PASSWORD` env var

3. **Verify features:**
   - Patient assessments list
   - Appointments database
   - System logs (check email status)
   - Status updates work correctly

## Troubleshooting

### Appointment Booking Fails

**Error:** "Could not save the appointment (Status 422)"

**Solutions:**
1. Check date format (must be YYYY-MM-DD)
2. Ensure date is not in the past
3. Verify all required fields are filled
4. Check browser console for detailed error

### Email Not Sending

**Check:**
1. `GMAIL_TOKEN_JSON` environment variable is set
2. Token is valid and not expired
3. Check system logs in admin panel for email status
4. Email failures won't block appointment booking

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solution:**
- Backend now allows all origins with `allow_origins=["*"]`
- If still seeing errors, check backend is deployed and accessible

## Post-Deployment Checklist

- [ ] Backend deployed to Render successfully
- [ ] Frontend files uploaded to anarvaclinic.com
- [ ] Test booking with valid data succeeds
- [ ] Test booking with past date shows error
- [ ] Test booking with invalid email shows error
- [ ] Test booking on mobile devices works
- [ ] Test booking on tablet works
- [ ] Email notifications are sent (check logs)
- [ ] Admin panel accessible and functional
- [ ] System logs show email status correctly

## Contact

For issues or questions:
- Backend URL: https://anarva-clinic.onrender.com
- Frontend URL: https://anarvaclinic.com
- Test Page: https://anarvaclinic.com/test-booking.html
