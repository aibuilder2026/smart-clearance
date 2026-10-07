"""Cloud Storage: the label photos (Vision reads), the DMS exports (the Data agent reads) and the PDFs (Paperwork
writes), in each environment's own buckets (infra/prod storage.tf)."""

import asyncio
from functools import cached_property
from typing import Protocol

from sc_agents.settings import Settings


def split(uri: str) -> tuple[str, str]:
    """gs://bucket/a/b.csv → (bucket, a/b.csv)"""
    if not uri.startswith("gs://"):
        raise ValueError(f"not a gs:// name: {uri}")
    bucket, _, name = uri[5:].partition("/")
    if not bucket or not name:
        raise ValueError(f"not a gs:// object: {uri}")
    return bucket, name


class Store(Protocol):
    async def read(self, bucket: str, name: str) -> bytes: ...

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> None: ...

    async def list(self, bucket: str, prefix: str) -> list[str]:
        """the object names under a prefix"""
        ...


class GcsStore:
    def __init__(self, settings: Settings):
        self.project = settings.google_cloud_project

    @cached_property
    def client(self):
        from google.cloud import storage

        from sc_agents.gcp import credentials

        return storage.Client(project=self.project, credentials=credentials())

    async def read(self, bucket: str, name: str) -> bytes:
        return await asyncio.to_thread(lambda: self.client.bucket(bucket).blob(name).download_as_bytes())

    async def write(self, bucket: str, name: str, data: bytes, content_type: str) -> None:
        def put() -> None:
            self.client.bucket(bucket).blob(name).upload_from_string(data, content_type=content_type)

        await asyncio.to_thread(put)

    async def list(self, bucket: str, prefix: str) -> list[str]:
        return await asyncio.to_thread(lambda: [b.name for b in self.client.list_blobs(bucket, prefix=prefix)])
