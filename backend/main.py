from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CodeAtlas", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    repo_name: str

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "prototype": "4h"}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    # Mocked result for an early hackathon checkpoint.
    return {
        "repo": request.repo_name,
        "summary": "Initial scan complete",
        "top_languages": ["TypeScript", "Python"],
        "estimated_modules": 6,
        "next_step": "Integrate real parser and graph builder",
    }
