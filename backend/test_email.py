"""Test script to check if email notifications are working."""
import requests
import json
import sys
import io

# Fix Unicode encoding for Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
API_URL = "https://anarva-clinic.onrender.com"

def test_health():
    """Test if backend is running."""
    print("=" * 60)
    print("TEST 1: Backend Health Check")
    print("=" * 60)
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_email_config():
    """Test email configuration (requires doctor auth)."""
    print("\n" + "=" * 60)
    print("TEST 2: Email Configuration Check")
    print("=" * 60)
    print("Note: This requires doctor authentication")
    print("To test manually, login to admin panel and check system logs")
    
    # Try without auth first to see if endpoint exists
    try:
        response = requests.get(f"{API_URL}/api/check-email-config", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (requires authentication)")
            print("→ Login to admin panel to check email config")
            return True
        elif response.status_code == 200:
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_send_email():
    """Test sending an email (requires doctor auth)."""
    print("\n" + "=" * 60)
    print("TEST 3: Send Test Email")
    print("=" * 60)
    print("Note: This requires doctor authentication")
    print("To test manually:")
    print("1. Login to admin panel: anarvaclinic.com/hair-loss-assessment/?doctor")
    print("2. Open browser console and run:")
    print("   fetch('/api/test-email', {method: 'POST'})")
    print("3. Check your Gmail inbox at anarvaclinic8@gmail.com")
    
    # Try without auth first
    try:
        response = requests.post(f"{API_URL}/api/test-email", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Endpoint exists (requires authentication)")
            return True
        elif response.status_code == 200:
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_appointment_booking():
    """Book a test appointment to trigger email."""
    print("\n" + "=" * 60)
    print("TEST 4: Book Test Appointment (Triggers Email)")
    print("=" * 60)
    
    from datetime import date, timedelta
    future_date = (date.today() + timedelta(days=5)).isoformat()
    
    test_data = {
        "patient_name": "Email Test Patient",
        "patient_phone": "+919876543210",
        "specialist": "Dr. Ajith Kumar",
        "date": future_date,
        "time_slot": "10:00 AM",
        "type": "In-Clinic Visit",
        "notes": "This is a test to check if email notifications are working"
    }
    
    print(f"Booking appointment with date: {future_date}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/appointments",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            print(f"\n✅ Appointment booked successfully!")
            print(f"Appointment ID: {result.get('appointment', {}).get('appointment_id')}")
            print(f"\n→ Check your Gmail inbox at anarvaclinic8@gmail.com")
            print(f"→ Check system logs in admin panel for email status")
            return True
        else:
            print(f"❌ Failed to book appointment")
            return False
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def main():
    print("Email Notification Test Suite")
    print(f"Testing against: {API_URL}")
    print()
    
    results = []
    
    # Test 1: Health check
    results.append(("Backend Health", test_health()))
    
    # Test 2: Email config check
    results.append(("Email Config Endpoint", test_email_config()))
    
    # Test 3: Send test email
    results.append(("Test Email Endpoint", test_send_email()))
    
    # Test 4: Book appointment (triggers email)
    results.append(("Appointment Booking", test_appointment_booking()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print("\n" + "=" * 60)
    print("HOW TO CHECK EMAIL STATUS")
    print("=" * 60)
    print("1. Login to admin panel:")
    print("   https://anarvaclinic.com/hair-loss-assessment/?doctor")
    print()
    print("2. Go to 'System Logs' tab")
    print()
    print("3. Look for email operations with:")
    print("   - 'sent' = Email sent successfully")
    print("   - 'config_error' = Gmail token not configured")
    print("   - 'api_error' = Network or Gmail API error")
    print()
    print("4. Check Gmail inbox:")
    print("   anarvaclinic8@gmail.com")
    print()
    print("5. If email not configured:")
    print("   - Set GMAIL_TOKEN_JSON in Render environment variables")
    print("   - Or generate token locally: backend/secrets/gmail-token.json")

if __name__ == "__main__":
    main()
