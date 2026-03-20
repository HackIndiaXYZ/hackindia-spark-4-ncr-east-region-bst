from __future__ import annotations

import shutil
from pathlib import Path

from git import Repo
from app.services.analyzer import RepoSummary
from app.api.schemas import AnalyzeGithubResponse, JobStatus
from app.services.analyzer import analyze_repository
from app.services.job_store import job_store


def run_full_pipeline(
    job_id: str,
    source_path: str,
    company_stack: list[str] | None = None,
    cleanup_path: str | None = None,
    git_repo: Repo | None = None,
) -> None:
    repo_path = Path(source_path)
    try:
        job_store.update(job_id, status=JobStatus.processing, message="Analyzing repository structure...")
        result: AnalyzeGithubResponse = analyze_repository(repo_path, git_repo, company_stack=company_stack)
        job_store.update(
            job_id,
            status=JobStatus.done,
            message="Analysis complete",
            graph=result.graph,
            repo=result.repo,
        )
    except Exception as exc:
        job_store.update(job_id, status=JobStatus.error, message="Analysis failed", error=str(exc))
    finally:
        if cleanup_path:
            shutil.rmtree(cleanup_path, ignore_errors=True)
