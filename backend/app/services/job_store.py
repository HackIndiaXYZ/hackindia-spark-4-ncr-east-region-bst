from __future__ import annotations

from threading import Lock
from typing import Any

from app.api.schemas import JobState, JobStatus


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, JobState] = {}
        self._lock = Lock()

    def create(self, job_id: str, source: str, meta: dict[str, Any] | None = None, message: str = "Queued") -> JobState:
        job = JobState(job_id=job_id, status=JobStatus.pending, source=source, message=message, meta=meta or {})
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> JobState | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **changes: Any) -> JobState | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            updated = job.model_copy(update=changes)
            self._jobs[job_id] = updated
            return updated


job_store = JobStore()
