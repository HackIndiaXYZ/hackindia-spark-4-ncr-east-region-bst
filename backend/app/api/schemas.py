from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class AnalyzeGithubRequest(BaseModel):
    repo_url: HttpUrl
    company_stack: list[str] = Field(default_factory=list)
    focus_domains: list[str] = Field(default_factory=list)


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    error = "error"


class AnalyzeURLRequest(BaseModel):
    url: HttpUrl
    branch: str = "main"
    company_stack: list[str] = Field(default_factory=list)


class AnalyzePasteRequest(BaseModel):
    filename: str = Field(default="snippet.py")
    code: str
    company_stack: list[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    job_id: str
    status: JobStatus
    message: str


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    domain_tags: list[str] = Field(default_factory=list)
    filter_tags: dict[str, list[str]] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    size: float = 1.0
    color: str = "#2563eb"


class GraphLink(BaseModel):
    source: str
    target: str
    relation: str
    weight: float = 1.0
    metadata: dict[str, Any] = Field(default_factory=dict)


class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]
    available_domains: list[str]
    available_filters: dict[str, list[str]]
    stats: dict[str, Any] = Field(default_factory=dict)


class RepoSummary(BaseModel):
    name: str
    root_path: str
    default_branch: str | None = None
    commit_sha: str | None = None


class AnalyzeGithubResponse(BaseModel):
    repo: RepoSummary
    graph: GraphPayload


class JobState(BaseModel):
    job_id: str
    status: JobStatus
    source: str
    message: str = ""
    error: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)
    graph: GraphPayload | None = None
    repo: RepoSummary | None = None


class ExplainRequest(BaseModel):
    job_id: str
    node_id: str


class ExplainResponse(BaseModel):
    node_id: str
    summary: str
    responsibilities: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    complexity: str = "unknown"


class ChatRequest(BaseModel):
    job_id: str
    message: str
    context_node: str | None = None


class DocsRequest(BaseModel):
    job_id: str
    node_id: str


class HealthResponse(BaseModel):
    status: str
