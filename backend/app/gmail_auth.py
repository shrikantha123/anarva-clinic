"""Run once locally to authorize the Gmail account used for notifications."""
from app.config import get_settings
from app.services.email_notifications import GMAIL_SEND_SCOPE


def authorize_gmail() -> None:
    from google_auth_oauthlib.flow import InstalledAppFlow

    settings = get_settings()
    client_secrets = settings.gmail_client_secrets_file
    if not client_secrets.is_file():
        raise FileNotFoundError(
            "Gmail OAuth client JSON was not found. Put one client_secret*.json file "
            "in the root secrets directory, or set GMAIL_CLIENT_SECRETS_FILE."
        )

    flow = InstalledAppFlow.from_client_secrets_file(
        str(client_secrets), [GMAIL_SEND_SCOPE]
    )
    credentials = flow.run_local_server(
        host="localhost",
        port=settings.gmail_oauth_port,
        access_type="offline",
        prompt="consent",
    )
    settings.gmail_token_file.parent.mkdir(parents=True, exist_ok=True)
    settings.gmail_token_file.write_text(credentials.to_json(), encoding="utf-8")
    print("Gmail authorization completed. The token is stored in the ignored secrets folder.")


if __name__ == "__main__":
    authorize_gmail()