from __future__ import annotations

import shutil
import uuid
import zipfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.api.schemas import AnalyzePasteRequest, AnalyzeResponse, AnalyzeURLRequest, JobStatus
from app.services.job_store import job_store
from app.services.pipeline import run_full_pipeline
from app.services.repo_loader import cleanup_repository, clone_repository

router = APIRouter()

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/url", response_model=AnalyzeResponse)
def analyze_url(request: AnalyzeURLRequest, background_tasks: BackgroundTasks) -> AnalyzeResponse:
    job_id = str(uuid.uuid4())[:8]
    job_store.create(job_id, source="url", meta={"url": str(request.url), "branch": request.branch}, message="Queued URL analysis")
    background_tasks.add_task(process_github_url, job_id, str(request.url), request.branch, request.company_stack)
    return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="Repository queued for analysis")


@router.post("/zip", response_model=AnalyzeResponse)
async def analyze_zip(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    company_stack: list[str] = Form([]),
) -> AnalyzeResponse:
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip uploads are supported")

    job_id = str(uuid.uuid4())[:8]
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    zip_path = job_dir / file.filename
    with zip_path.open("wb") as output:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            output.write(chunk)

    job_store.create(
        job_id,
        source="zip",
        meta={"filename": file.filename, "company_stack": company_stack},
        message="Queued ZIP analysis",
    )
    background_tasks.add_task(process_zip, job_id, str(zip_path), str(job_dir), company_stack)
    return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="ZIP queued for analysis")


@router.post("/paste", response_model=AnalyzeResponse)
def analyze_paste(request: AnalyzePasteRequest, background_tasks: BackgroundTasks) -> AnalyzeResponse:
    job_id = str(uuid.uuid4())[:8]
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    filename = Path(request.filename).name or "snippet.py"
    code_file = job_dir / filename
    code_file.write_text(request.code, encoding="utf-8", errors="ignore")

    job_store.create(job_id, source="paste", meta={"filename": filename}, message="Queued paste analysis")
    background_tasks.add_task(run_full_pipeline, job_id, str(job_dir), request.company_stack, str(job_dir))
    return AnalyzeResponse(job_id=job_id, status=JobStatus.pending, message="Code snippet queued for analysis")


@router.get("/status/{job_id}")
def get_status(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def process_github_url(job_id: str, url: str, branch: str, company_stack: list[str]) -> None:
    repo_dir = None
    try:
        job_store.update(job_id, status=JobStatus.processing, message="Cloning repository...")
        repo_dir, git_repo = clone_repository(url, branch=branch)
        run_full_pipeline(job_id, str(repo_dir), company_stack=company_stack, git_repo=git_repo)
    except Exception as exc:
        job_store.update(job_id, status=JobStatus.error, message="URL ingest failed", error=str(exc))
    finally:
        if repo_dir is not None:
            cleanup_repository(repo_dir)


def process_zip(job_id: str, zip_path: str, job_dir: str, company_stack: list[str] | None = None) -> None:
    zip_file = Path(zip_path)
    extract_dir = Path(job_dir) / "repo"
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        job_store.update(job_id, status=JobStatus.processing, message="Extracting ZIP...")
        with zipfile.ZipFile(zip_file, "r") as archive:
            archive.extractall(extract_dir)
        run_full_pipeline(job_id, str(extract_dir), company_stack=company_stack)
    except Exception as exc:
        job_store.update(job_id, status=JobStatus.error, message="ZIP ingest failed", error=str(exc))
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)
