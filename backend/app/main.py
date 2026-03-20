from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.analyzer import summarize_repository
from app.services.graph_builder import build_directory_graph
from app.services.ml_ranker import rank_files_by_prompt

app = FastAPI(title="CodeAtlas 12h Prototype API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    repo_path: str = Field(..., description="Local path to repository")


class MLPromptRequest(BaseModel):
    prompt: str
    documents: list[dict] = Field(default_factory=list)
    repo_path: str | None = None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "prototype": "12h"}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    try:
        summary = summarize_repository(request.repo_path)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "total_files": summary.total_files,
        "total_lines": summary.total_lines,
        "project_type": summary.project_type,
        "focus_modules": summary.focus_modules,
        "observations": summary.observations,
        "technical_metrics": summary.technical_metrics,
        "top_extensions": summary.top_extensions,
        "hottest_files": summary.hottest_files,
    }


@app.post("/api/graph")
def graph(request: AnalyzeRequest) -> dict:
    try:
        return build_directory_graph(request.repo_path)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/ml/rank")
def rank(request: MLPromptRequest) -> dict:
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt must not be empty")

    docs = request.documents
    if request.repo_path and not docs:
        from app.services.ml_ranker import build_documents_from_repository

        docs = build_documents_from_repository(request.repo_path, max_files=120)

    return {"results": rank_files_by_prompt(request.prompt, docs)}


@app.get("/")
def index() -> dict:
    return {
        "name": "CodeAtlas 12h prototype",
        "endpoints": [
            "/api/health",
            "/api/analyze",
            "/api/graph",
            "/api/ml/rank",
        ],
    }
