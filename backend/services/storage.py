import os
import tempfile
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET_NAME = "documents"


def _client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_file(file_bytes: bytes, filename: str) -> str:
    """Upload bytes to Supabase Storage. Returns the storage path."""
    _client().storage.from_(BUCKET_NAME).upload(
        filename, file_bytes, {"upsert": "true"}
    )
    return filename


def download_to_temp(filename: str, ext: str) -> str:
    """Download file from Supabase Storage to a temp file. Returns temp file path."""
    data = _client().storage.from_(BUCKET_NAME).download(filename)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    tmp.write(data)
    tmp.close()
    return tmp.name


def delete_file(filename: str) -> None:
    """Delete a file from Supabase Storage."""
    _client().storage.from_(BUCKET_NAME).remove([filename])
