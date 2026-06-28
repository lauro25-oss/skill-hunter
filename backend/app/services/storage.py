import base64
import uuid


def encode_file(file_bytes: bytes) -> str:
    """Converte arquivo para base64 para armazenar no PostgreSQL."""
    return base64.b64encode(file_bytes).decode("utf-8")


def decode_file(b64_string: str) -> bytes:
    """Converte base64 de volta para bytes."""
    return base64.b64decode(b64_string)


def make_data_url(b64_string: str, content_type: str) -> str:
    """Gera uma data URL para exibir/baixar o arquivo no browser."""
    return f"data:{content_type};base64,{b64_string}"


async def upload_file(file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
    """
    'Armazena' o arquivo em base64.
    Retorna (blob_id, base64_string) — blob_id é apenas um UUID para referência.
    """
    blob_id  = str(uuid.uuid4())
    b64_data = encode_file(file_bytes)
    return blob_id, b64_data


async def delete_file(blob_id: str):
    """Sem operação — a exclusão é feita junto com o registro no banco."""
    pass


async def generate_signed_url(b64_data: str, content_type: str = "application/pdf") -> str:
    """Retorna uma data URL diretamente do base64 armazenado."""
    return make_data_url(b64_data, content_type)
