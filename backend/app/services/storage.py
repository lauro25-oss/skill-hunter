import asyncio
import base64
import os
import uuid
from typing import Optional

_ENDPOINT = os.environ.get("S3_ENDPOINT_URL", "")
_BUCKET   = os.environ.get("S3_BUCKET", "")
_ACCESS   = os.environ.get("S3_ACCESS_KEY", "")
_SECRET   = os.environ.get("S3_SECRET_KEY", "")
_REGION   = os.environ.get("S3_REGION", "auto")
_USE_S3   = bool(_ENDPOINT and _BUCKET and _ACCESS and _SECRET)

_s3_client = None
if _USE_S3:
    import boto3
    from botocore.client import Config
    _s3_client = boto3.client(
        "s3",
        endpoint_url=_ENDPOINT,
        aws_access_key_id=_ACCESS,
        aws_secret_access_key=_SECRET,
        region_name=_REGION,
        config=Config(signature_version="s3v4"),
    )


def encode_file(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode("utf-8")


def decode_file(b64_string: str) -> bytes:
    return base64.b64decode(b64_string)


async def upload_file(
    file_bytes: bytes, filename: str, content_type: str
) -> tuple[Optional[str], Optional[str]]:
    """
    Faz upload do arquivo no storage configurado.
    Retorna (s3_key, base64_string) — um deles sempre será None.
    """
    if _USE_S3:
        key = f"curriculos/{uuid.uuid4()}_{filename}"
        def _put():
            _s3_client.put_object(
                Bucket=_BUCKET, Key=key, Body=file_bytes, ContentType=content_type
            )
        await asyncio.to_thread(_put)
        return key, None
    else:
        return None, encode_file(file_bytes)


async def get_file_bytes(s3_key: str) -> bytes:
    def _get():
        return _s3_client.get_object(Bucket=_BUCKET, Key=s3_key)["Body"].read()
    return await asyncio.to_thread(_get)


async def generate_presigned_url(s3_key: str, expires: int = 3600) -> str:
    def _sign():
        return _s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": _BUCKET, "Key": s3_key},
            ExpiresIn=expires,
        )
    return await asyncio.to_thread(_sign)


async def delete_file(key: str):
    if _USE_S3 and key:
        def _del():
            _s3_client.delete_object(Bucket=_BUCKET, Key=key)
        await asyncio.to_thread(_del)
