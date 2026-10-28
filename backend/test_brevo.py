"""Test script to verify Brevo email configuration."""
import os
import sys

# Set your Brevo API key here for testing
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "xkeysib-your-api-key-here")

def test_brevo_email():
    """Test sending an email via Brevo."""
    print("=" * 60)
    print("Brevo Email Test")
    print("=" * 60)
    
    # Check if API key is set
    if BREVO_API_KEY == "xkeysib-your-api-key-here":
        print("\n❌ Please set your Brevo API key:")
        print("   Option 1: Set BREVO_API_KEY environment variable")
        print("   Option 2: Edit this file and replace the placeholder")
        return False
    
    print(f"\nAPI Key: {BREVO_API_KEY[:20]}...")
    
    try:
        from app.services.brevo_email import _send_brevo_email
        
        print("\nSending test email...")
        result = _send_brevo_email(
            to_email="anarvaclinic8@gmail.com",
            subject="Brevo Test Email - Anarva Clinic",
            html_content="""
                <h1>Test Email from Brevo</h1>
                <p>This is a test email to verify Brevo is working correctly.</p>
                <p><strong>If you received this, Brevo is configured successfully!</strong></p>
                <hr>
                <p>From: Anarva Clinic Backend</p>
            """
        )
        
        print("\n✅ Email sent successfully!")
        print(f"Response: {result}")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to send email: {e}")
        print(f"\nTroubleshooting:")
        print("1. Verify your Brevo API key is correct")
        print("2. Check that anarvaclinic8@gmail.com is verified in Brevo")
        print("3. Ensure you have credits in your Brevo account")
        return False

if __name__ == "__main__":
    success = test_brevo_email()
    sys.exit(0 if success else 1)
