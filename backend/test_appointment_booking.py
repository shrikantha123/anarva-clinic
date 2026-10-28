"""Test script for appointment booking API with various data scenarios."""
import requests
import json
from datetime import date, timedelta
import sys
import io

# Fix Unicode encoding for Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration - Update this to your backend URL
API_URL = "https://anarva-clinic.onrender.com"  # Deployed backend URL

def test_appointment(test_name, data, expected_success=True):
    """Test appointment booking with given data."""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    print(f"Request Data:")
    print(json.dumps(data, indent=2))
    
    try:
        response = requests.post(
            f"{API_URL}/api/appointments",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
        
        if expected_success:
            if response.status_code == 200:
                print("✅ PASS - Appointment booked successfully")
                return True
            else:
                print(f"❌ FAIL - Expected 200, got {response.status_code}")
                return False
        else:
            if response.status_code == 422:
                print("✅ PASS - Validation error caught as expected")
                return True
            else:
                print(f"❌ FAIL - Expected 422, got {response.status_code}")
                return False
                
    except requests.exceptions.RequestException as e:
        print(f"❌ FAIL - Request error: {e}")
        return False

def main():
    print("Appointment Booking Test Suite")
    print(f"Testing against: {API_URL}")
    
    results = []
    
    # Test 1: Valid appointment with future date
    future_date = (date.today() + timedelta(days=5)).isoformat()
    results.append(test_appointment(
        "Valid appointment (future date)",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test appointment"
        },
        expected_success=True
    ))
    
    # Test 2: Past date (should fail)
    past_date = (date.today() - timedelta(days=5)).isoformat()
    results.append(test_appointment(
        "Invalid appointment (past date)",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": past_date,
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test appointment"
        },
        expected_success=False
    ))
    
    # Test 3: Invalid email format in notes
    results.append(test_appointment(
        "Valid appointment with email in notes",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "11:00 AM",
            "type": "Online Video Consult",
            "notes": "Email: invalid-email-format"
        },
        expected_success=True  # Notes field doesn't validate email
    ))
    
    # Test 4: Empty required fields
    results.append(test_appointment(
        "Missing patient name",
        {
            "patient_name": "",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test"
        },
        expected_success=False
    ))
    
    # Test 5: Special characters in name
    results.append(test_appointment(
        "Special characters in name",
        {
            "patient_name": "José María García-López",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "12:00 PM",
            "type": "In-Clinic Visit",
            "notes": "Test with special chars"
        },
        expected_success=True
    ))
    
    # Test 6: Very long notes
    results.append(test_appointment(
        "Long notes field",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "01:00 PM",
            "type": "In-Clinic Visit",
            "notes": "A" * 500  # 500 characters
        },
        expected_success=True
    ))
    
    # Test 7: Different phone formats
    results.append(test_appointment(
        "Phone without + prefix",
        {
            "patient_name": "Test Patient",
            "patient_phone": "9876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test"
        },
        expected_success=True
    ))
    
    # Test 8: Invalid date format
    results.append(test_appointment(
        "Invalid date format (not ISO)",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": "25/12/2026",  # Wrong format
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test"
        },
        expected_success=False
    ))
    
    # Test 9: Today's date (should work)
    today = date.today().isoformat()
    results.append(test_appointment(
        "Today's date",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": today,
            "time_slot": "10:00 AM",
            "type": "In-Clinic Visit",
            "notes": "Test for today"
        },
        expected_success=True
    ))
    
    # Test 10: Empty time slot
    results.append(test_appointment(
        "Empty time slot",
        {
            "patient_name": "Test Patient",
            "patient_phone": "+919876543210",
            "specialist": "Dr. Ajith Kumar",
            "date": future_date,
            "time_slot": "",
            "type": "In-Clinic Visit",
            "notes": "Test"
        },
        expected_success=False
    ))
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n✅ All tests passed!")
        return 0
    else:
        print(f"\n❌ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
