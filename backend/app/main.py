from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.schemas import AnalyzeGithubRequest, AnalyzeGithubResponse, HealthResponse
from app.api.routers.ai_chat import router as ai_chat_router
from app.api.routers.graph import router as graph_router
from app.api.routers.ingest import router as ingest_router
from app.services.analyzer import analyze_repository
from app.services.repo_loader import cleanup_repository, clone_repository

app = FastAPI(title="CodeAtlas API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_chat_router, prefix="/api/ai", tags=["AI"])
app.include_router(graph_router, prefix="/api/graph", tags=["Graph"])
app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingest"])

@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/")
def root() -> dict[str, object]:
    return {
        "name": "CodeAtlas AI",
        "status": "running",
        "endpoints": [
            "POST /api/ingest/url",
            "POST /api/ingest/zip",
            "POST /api/ingest/paste",
            "GET /api/ingest/status/{job_id}",
            "GET /api/graph/{job_id}",
            "GET /api/graph/{job_id}/summary",
            "POST /api/ai/explain",
            "POST /api/ai/chat",
            "GET /api/ai/docs/{job_id}/{module}",
            "POST /api/analyze/github",
        ],
    }


@app.post("/api/analyze/github", response_model=AnalyzeGithubResponse)
def analyze_github_repo(payload: AnalyzeGithubRequest) -> AnalyzeGithubResponse:
    """Backward-compatible endpoint used by current frontend."""
    repo_dir = None
    try:
        repo_dir, git_repo = clone_repository(str(payload.repo_url), branch=None)
        return analyze_repository(repo_dir, git_repo, company_stack=payload.company_stack)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Repository analysis failed: {exc}") from exc
    finally:
        if repo_dir is not None:
            cleanup_repository(repo_dir)