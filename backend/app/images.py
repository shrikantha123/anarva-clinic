"""Image validation and normalisation.

Every photo is decoded and re-encoded as a bounded JPEG. Declared MIME types are never trusted,
metadata (EXIF/GPS) is dropped, and nothing from an upload is ever written to disk or executed.
"""
import base64
import binascii
import io
import re
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import APP_BASE, DIST_DIR, ROOT

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 60_000_000
MIN_SIDE = 200
MAX_SIDE = 1600
FORMATS = {"JPEG", "MPO", "PNG", "WEBP"}
DATA_URI = re.compile(r"^data:image/[\w.+-]+;base64,", re.IGNORECASE)

# The "Use sample photo" button sends the bundled asset's URL instead of a data URI.
SAMPLE_ROOTS = {
    f"{APP_BASE}/assets/": DIST_DIR / "assets",
    f"{APP_BASE}/src/assets/": ROOT / "src" / "assets",
}

UNREADABLE = "This photo could not be read. Please retake it or choose a different image."
TOO_LARGE = "This photo is too large. Please use an image under 10 MB."
BAD_FORMAT = "Please use a JPG, PNG or WebP photo."
TOO_SMALL = "This photo is too small to analyse. Please retake it closer to your head in good light."


class ImageRejected(Exception):
    """Message is patient-friendly and safe to return to the client."""


def _read_sample(value: str) -> bytes:
    for prefix, root in SAMPLE_ROOTS.items():
        if value.startswith(prefix):
            path = (root / value.removeprefix(prefix)).resolve()
            if path.is_relative_to(root.resolve()) and path.is_file() and path.stat().st_size <= MAX_BYTES:
                return path.read_bytes()
    raise ImageRejected(UNREADABLE)


def _read(value: str) -> bytes:
    if not DATA_URI.match(value):
        return _read_sample(value)
    encoded = value.split(",", 1)[1]
    if len(encoded) * 3 // 4 > MAX_BYTES:
        raise ImageRejected(TOO_LARGE)
    try:
        return base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise ImageRejected(UNREADABLE) from None


def process(value: str) -> bytes:
    """Validate an uploaded photo and return it as normalised JPEG bytes."""
    raw = _read(value)
    try:
        with Image.open(io.BytesIO(raw)) as img:
            if img.format not in FORMATS:
                raise ImageRejected(BAD_FORMAT)
            if img.width * img.height > MAX_PIXELS:
                raise ImageRejected(TOO_LARGE)
            if min(img.size) < MIN_SIDE:
                raise ImageRejected(TOO_SMALL)
            img.load()  # surfaces truncated or corrupted data
            img = ImageOps.exif_transpose(img).convert("RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE))
        out = io.BytesIO()
        img.save(out, "JPEG", quality=85)
        return out.getvalue()
    except ImageRejected:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        raise ImageRejected(UNREADABLE) from None


def to_data_uri(value: str) -> str:
    return "data:image/jpeg;base64," + base64.b64encode(process(value)).decode()
