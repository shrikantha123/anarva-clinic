"""Doctor authentication: signed, expiring session token plus brute-force throttling."""
import hmac
import time
from collections import defaultdict

from app.config import Settings
from app.errors import AppError

COOKIE_NAME = "anarva_doctor"
TOKEN_TTL_SECONDS = 8 * 3600
ATTEMPT_WINDOW_SECONDS = 900
MAX_FAILED_ATTEMPTS = 5

DOCTOR_PROFILE = {
    "name": "Dr. S. Mukherjee",
    "role": "Senior Trichologist & Hair Transplant Surgeon",
    "clinic": "Anarva Clinic Indiranagar",
}

_failures: dict[str, list[float]] = defaultdict(list)


def _sign(secret: str, expires: str) -> str:
    return hmac.new(secret.encode(), expires.encode(), "sha256").hexdigest()


def issue_token(secret: str) -> str:
    expires = str(int(time.time()) + TOKEN_TTL_SECONDS)
    return f"{expires}.{_sign(secret, expires)}"


def verify_token(secret: str, token: str) -> bool:
    expires, _, signature = token.partition(".")
    return expires.isdigit() and int(expires) > time.time() and hmac.compare_digest(signature, _sign(secret, expires))


def login(settings: Settings, username: str, password: str, client_ip: str) -> str:
    if settings.doctor_password is None:
        raise AppError(503, "Doctor login is not configured")
    now = time.time()
    recent = [t for t in _failures[client_ip] if t > now - ATTEMPT_WINDOW_SECONDS]
    if len(recent) >= MAX_FAILED_ATTEMPTS:
        raise AppError(429, "Too many failed attempts. Please try again later.")

    user_ok = hmac.compare_digest(username.encode(), settings.doctor_username.encode())
    pass_ok = hmac.compare_digest(password.encode(), settings.doctor_password.get_secret_value().encode())
    if not (user_ok and pass_ok):
        _failures[client_ip] = [*recent, now]
        raise AppError(401, "Invalid doctor username or password")
    _failures.pop(client_ip, None)
    return issue_token(settings.secret_key.get_secret_value())
