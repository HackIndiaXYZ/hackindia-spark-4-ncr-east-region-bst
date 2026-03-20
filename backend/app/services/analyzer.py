from __future__ import annotations

import re
from collections import Counter, defaultdict
from itertools import islice
from pathlib import Path
from typing import Any

import networkx as nx
from git import Repo

from app.api.schemas import AnalyzeGithubResponse, GraphLink, GraphNode, GraphPayload, RepoSummary

IGNORED_DIRS = {
    ".git",
    ".github",
    ".idea",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "venv",
}

SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "react",
    ".ts": "typescript",
    ".tsx": "react",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".md": "docs",
    ".json": "config",
    ".yaml": "config",
    ".yml": "config",
}

IMPORT_PATTERNS = {
    "python": [
        re.compile(r"^\s*import\s+([a-zA-Z0-9_\.]+)", re.MULTILINE),
        re.compile(r"^\s*from\s+([a-zA-Z0-9_\.]+)\s+import\s+", re.MULTILINE),
    ],
    "javascript": [
        re.compile(r"import\s+.*?from\s+[\"']([^\"']+)[\"']"),
        re.compile(r"require\([\"']([^\"']+)[\"']\)"),
    ],
    "typescript": [
        re.compile(r"import\s+.*?from\s+[\"']([^\"']+)[\"']"),
        re.compile(r"require\([\"']([^\"']+)[\"']\)"),
    ],
    "react": [
        re.compile(r"import\s+.*?from\s+[\"']([^\"']+)[\"']"),
        re.compile(r"require\([\"']([^\"']+)[\"']\)"),
    ],
    "java": [
        re.compile(r"^\s*import\s+([a-zA-Z0-9_\.\*]+);", re.MULTILINE),
    ],
    "go": [
        re.compile(r"^\s*import\s+[\"']([^\"']+)[\"']", re.MULTILINE),
        re.compile(r"^\s*import\s*\((.*?)\)", re.MULTILINE | re.DOTALL),
    ],
    "rust": [
        re.compile(r"^\s*use\s+([a-zA-Z0-9_:]+)", re.MULTILINE),
    ],
}

STACK_RULES = [
    {
        "match": ["fastapi", "uvicorn", "starlette"],
        "stack": ["FastAPI", "Python API"],
        "concepts": ["routing", "rest api", "async backend"],
        "domains": ["backend", "swe"],
    },
    {
        "match": ["langchain", "llm", "rag", "openai", "transformers", "sentence_transformers", "faiss"],
        "stack": ["LangChain", "Transformers", "FAISS"],
        "concepts": ["rag", "embeddings", "retrieval", "llm orchestration"],
        "domains": ["ai", "swe"],
    },
    {
        "match": ["networkx", "graph", "neo4j"],
        "stack": ["NetworkX", "Graph Analytics"],
        "concepts": ["dependency graph", "graph metrics", "graph traversal"],
        "domains": ["ai", "data", "swe"],
    },
    {
        "match": ["react", "vite", "next", "tailwind", "d3", "react-force-graph"],
        "stack": ["React", "TailwindCSS", "D3", "Vite"],
        "concepts": ["ui state", "visualization", "component architecture"],
        "domains": ["frontend", "swe"],
    },
    {
        "match": ["docker", "kubernetes", "terraform", "helm", "github actions"],
        "stack": ["Docker", "Kubernetes", "Terraform"],
        "concepts": ["deployment", "infrastructure", "ci/cd"],
        "domains": ["devops", "swe"],
    },
    {
        "match": ["pandas", "numpy", "spark", "airflow", "dbt"],
        "stack": ["Pandas", "NumPy", "Airflow", "dbt"],
        "concepts": ["data processing", "pipelines", "analytics"],
        "domains": ["data", "ai"],
    },
    {
        "match": ["pytest", "jest", "cypress", "playwright"],
        "stack": ["Testing"],
        "concepts": ["test coverage", "quality assurance"],
        "domains": ["qa", "swe"],
    },
]

PATH_DOMAIN_HINTS = {
    "ai": ["ml", "model", "prompt", "embedding", "vector", "llm", "rag", "inference"],
    "backend": ["api", "server", "backend", "routes", "controller", "service"],
    "frontend": ["frontend", "ui", "component", "page", "view", "client"],
    "devops": ["infra", "deploy", "terraform", "docker", "k8s", "helm", "github/workflows"],
    "data": ["analytics", "dataset", "pipeline", "etl", "warehouse", "feature"],
    "qa": ["test", "spec", "e2e", "integration"],
}

NODE_COLORS = {
    "file": "#2563eb",
    "concept": "#d97706",
    "stack": "#7c3aed",
    "project": "#0891b2",
    "owner": "#059669",
    "learning": "#dc2626",
    "domain": "#1f2937",
}

MAX_FILE_SCAN = 1200
OWNER_SCAN_LIMIT = 300
CYCLE_SCAN_LIMIT = 350


def analyze_repository(repo_path: Path, git_repo: Repo | None = None, company_stack: list[str] | None = None) -> AnalyzeGithubResponse:
    company_stack = [item.strip() for item in (company_stack or []) if item.strip()]
    all_files = _collect_files(repo_path)
    files = all_files[:MAX_FILE_SCAN]
    truncated = len(all_files) > MAX_FILE_SCAN
    owner_enrichment_enabled = len(files) <= OWNER_SCAN_LIMIT
    file_index = _build_file_index(repo_path, files)
    graph = nx.DiGraph()
    nodes: list[GraphNode] = []
    links: list[GraphLink] = []
    filter_pool: dict[str, set[str]] = defaultdict(set)
    repo_name = repo_path.name
    domain_presence: Counter[str] = Counter()

    file_records: dict[str, dict[str, Any]] = {}

    for file_path in files:
        relative_path = file_path.relative_to(repo_path).as_posix()
        language = SUPPORTED_EXTENSIONS.get(file_path.suffix.lower(), "unknown")
        content = _read_text(file_path)
        imports = _extract_imports(language, content)
        stack_tags, concepts, domain_tags = _infer_tags(relative_path, content, imports, language)
        owner = _infer_owner(git_repo, relative_path) if owner_enrichment_enabled and git_repo else None
        project_tag = _project_tag(relative_path, repo_name)
        learning_tags = _learning_tags(stack_tags, company_stack)

        domain_tags = sorted(set(domain_tags or ["swe"]))
        stack_tags = sorted(set(stack_tags + [language.title()]))
        concepts = sorted(set(concepts))
        learning_tags = sorted(set(learning_tags))

        node = GraphNode(
            id=f"file:{relative_path}",
            label=file_path.name,
            type="file",
            domain_tags=domain_tags,
            filter_tags={
                "concepts": concepts,
                "projects": [project_tag],
                "stack": stack_tags,
                "owners": [owner] if owner else [],
                "learning": learning_tags,
            },
            metadata={
                "path": relative_path,
                "language": language,
                "imports": imports,
                "owner": owner,
                "preview": _preview(content),
            },
            size=max(6.0, 7.0 + len(imports) * 0.6 + len(domain_tags) * 0.5),
            color=NODE_COLORS["file"],
        )
        nodes.append(node)
        graph.add_node(node.id)
        file_records[relative_path] = {
            "node": node,
            "imports": imports,
            "project_tag": project_tag,
            "owner": owner,
            "stack_tags": stack_tags,
            "concepts": concepts,
            "learning_tags": learning_tags,
        }

        for domain_tag in domain_tags:
            domain_presence[domain_tag] += 1
        filter_pool["projects"].add(project_tag)
        filter_pool["stack"].update(stack_tags)
        filter_pool["concepts"].update(concepts)
        if owner:
            filter_pool["owners"].add(owner)
        filter_pool["learning"].update(learning_tags)

    added_nodes: set[str] = {node.id for node in nodes}
    added_links: set[tuple[str, str, str]] = set()

    for relative_path, record in file_records.items():
        source_id = record["node"].id
        resolved_targets = _resolve_import_targets(relative_path, record["imports"], file_index)
        for target_path, raw_import in resolved_targets:
            target_id = f"file:{target_path}"
            link_key = (source_id, target_id, "imports")
            if link_key in added_links:
                continue
            added_links.add(link_key)
            graph.add_edge(source_id, target_id)
            links.append(
                GraphLink(
                    source=source_id,
                    target=target_id,
                    relation="imports",
                    weight=1.0,
                    metadata={"symbol": raw_import},
                )
            )

    for relative_path, record in file_records.items():
        file_node = record["node"]
        for domain_tag in file_node.domain_tags:
            domain_id = f"domain:{domain_tag}"
            if domain_id not in added_nodes:
                nodes.append(
                    GraphNode(
                        id=domain_id,
                        label=domain_tag.upper(),
                        type="domain",
                        domain_tags=[domain_tag],
                        filter_tags={"concepts": [], "projects": [], "stack": [], "owners": [], "learning": []},
                        metadata={"domain": domain_tag},
                        size=10.0,
                        color=NODE_COLORS["domain"],
                    )
                )
                added_nodes.add(domain_id)
            _append_link(links, added_links, domain_id, file_node.id, "contains")

        _connect_tag_nodes(
            nodes,
            links,
            added_nodes,
            added_links,
            file_node,
            record["concepts"],
            "concept",
            "concept_of",
        )
        _connect_tag_nodes(
            nodes,
            links,
            added_nodes,
            added_links,
            file_node,
            record["stack_tags"],
            "stack",
            "uses_stack",
        )
        _connect_tag_nodes(
            nodes,
            links,
            added_nodes,
            added_links,
            file_node,
            [record["project_tag"]],
            "project",
            "belongs_to",
        )
        if record["owner"]:
            _connect_tag_nodes(
                nodes,
                links,
                added_nodes,
                added_links,
                file_node,
                [record["owner"]],
                "owner",
                "owned_by",
            )
        if record["learning_tags"]:
            _connect_tag_nodes(
                nodes,
                links,
                added_nodes,
                added_links,
                file_node,
                record["learning_tags"],
                "learning",
                "learn_next",
            )

    stats = {
        "total_nodes": len(nodes),
        "total_links": len(links),
        "file_count": len(file_records),
        "scanned_file_count": len(files),
        "scan_truncated": truncated,
        "owner_enrichment_enabled": owner_enrichment_enabled,
        "connected_components": nx.number_weakly_connected_components(graph) if graph.nodes else 0,
        "top_domains": domain_presence.most_common(),
        "top_central_files": _top_central_files(graph),
        "cycles": _sample_cycles(graph),
    }

    response = AnalyzeGithubResponse(
        repo=RepoSummary(
            name=repo_name,
            root_path=repo_path.as_posix(),
            default_branch=_repo_default_branch(git_repo),
            commit_sha=_repo_commit_sha(git_repo),
        ),
        graph=GraphPayload(
            nodes=nodes,
            links=links,
            available_domains=sorted(domain_presence.keys()),
            available_filters={key: sorted(values) for key, values in filter_pool.items()},
            stats=stats,
        ),
    )
    return response


def _repo_default_branch(git_repo: Repo | None) -> str | None:
    if git_repo is None:
        return None
    try:
        return getattr(git_repo.active_branch, "name", None) if not git_repo.head.is_detached else None
    except Exception:
        return None


def _repo_commit_sha(git_repo: Repo | None) -> str | None:
    if git_repo is None:
        return None
    try:
        return git_repo.head.commit.hexsha if git_repo.head.is_valid() else None
    except Exception:
        return None


def _collect_files(repo_path: Path) -> list[Path]:
    files: list[Path] = []
    for path in repo_path.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        files.append(path)
    return files


def _build_file_index(repo_path: Path, files: list[Path]) -> dict[str, Any]:
    by_relative: dict[str, Path] = {}
    by_stem: dict[str, list[str]] = defaultdict(list)
    for path in files:
        relative = path.relative_to(repo_path).as_posix()
        by_relative[relative] = path
        by_stem[path.stem].append(relative)
        without_suffix = str(path.relative_to(repo_path).with_suffix("")).replace("\\", "/")
        by_stem[without_suffix.split("/")[-1]].append(relative)
    return {"by_relative": by_relative, "by_stem": by_stem}


def _read_text(file_path: Path) -> str:
    try:
        return file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def _extract_imports(language: str, content: str) -> list[str]:
    imports: list[str] = []
    for pattern in IMPORT_PATTERNS.get(language, []):
        for match in pattern.findall(content):
            if isinstance(match, tuple):
                match = next((group for group in match if group), "")
            if language == "go" and "\n" in match:
                imports.extend(re.findall(r'[\"\']([^\"\']+)[\"\']', match))
            elif match:
                imports.append(str(match))
    return sorted(set(imports))


def _infer_tags(relative_path: str, content: str, imports: list[str], language: str) -> tuple[list[str], list[str], list[str]]:
    searchable = f"{relative_path.lower()}\n{content.lower()}\n{' '.join(imports).lower()}"
    stack_tags: list[str] = []
    concepts: list[str] = []
    domain_tags: list[str] = []

    for rule in STACK_RULES:
        if any(term in searchable for term in rule["match"]):
            stack_tags.extend(rule["stack"])
            concepts.extend(rule["concepts"])
            domain_tags.extend(rule["domains"])

    for domain, hints in PATH_DOMAIN_HINTS.items():
        if any(hint in relative_path.lower() for hint in hints):
            domain_tags.append(domain)

    if language in {"react", "javascript", "typescript"}:
        domain_tags.append("frontend")
    if language == "python":
        domain_tags.append("swe")
    if language == "docs":
        concepts.append("documentation")
    if "auth" in searchable:
        concepts.append("authentication")
    if "cache" in searchable:
        concepts.append("caching")
    if "queue" in searchable:
        concepts.append("async processing")
    if "database" in searchable or "sql" in searchable:
        concepts.append("data access")
        domain_tags.append("backend")

    return stack_tags, concepts, domain_tags


def _infer_owner(git_repo: Repo, relative_path: str) -> str | None:
    try:
        commit = next(git_repo.iter_commits(paths=relative_path, max_count=1), None)
    except Exception:
        return None
    if not commit or not commit.author:
        return None
    return commit.author.name


def _project_tag(relative_path: str, repo_name: str) -> str:
    parts = relative_path.split("/")
    return parts[0] if len(parts) > 1 else repo_name


def _learning_tags(stack_tags: list[str], company_stack: list[str]) -> list[str]:
    normalized_company = {item.lower() for item in company_stack}
    return [f"Learn {tag}" for tag in stack_tags if tag.lower() not in normalized_company and tag.lower() not in {"python", "javascript", "typescript", "react"}]


def _resolve_import_targets(relative_path: str, imports: list[str], file_index: dict[str, Any]) -> list[tuple[str, str]]:
    resolved: list[tuple[str, str]] = []
    source_dir = Path(relative_path).parent
    for raw_import in imports:
        target = _resolve_relative_import(source_dir, raw_import, file_index)
        if target:
            resolved.append((target, raw_import))
            continue
        target = _resolve_named_import(raw_import, file_index)
        if target:
            resolved.append((target, raw_import))
    return resolved


def _resolve_relative_import(source_dir: Path, raw_import: str, file_index: dict[str, Any]) -> str | None:
    if not raw_import.startswith(".") and not raw_import.startswith("/"):
        return None
    candidate_base = (source_dir / raw_import).as_posix()
    for suffix in (".ts", ".tsx", ".js", ".jsx", ".py", "/index.ts", "/index.tsx", "/index.js", "/index.jsx", "/__init__.py"):
        candidate = _normalize_relative_path(f"{candidate_base}{suffix}")
        if candidate in file_index["by_relative"]:
            return candidate
    return None


def _resolve_named_import(raw_import: str, file_index: dict[str, Any]) -> str | None:
    dotted = raw_import.replace(".", "/").replace("::", "/")
    candidates = [
        f"{dotted}.py",
        f"{dotted}.ts",
        f"{dotted}.tsx",
        f"{dotted}.js",
        f"{dotted}.jsx",
        f"{dotted}/__init__.py",
        f"{dotted}/index.ts",
        f"{dotted}/index.tsx",
        f"{dotted}/index.js",
        f"{dotted}/index.jsx",
    ]
    for candidate in candidates:
        normalized = _normalize_relative_path(candidate)
        for known in file_index["by_relative"].keys():
            if known.endswith(normalized):
                return known
    stem = dotted.split("/")[-1].replace("*", "")
    matches = file_index["by_stem"].get(stem, [])
    return matches[0] if matches else None


def _normalize_relative_path(value: str) -> str:
    normalized = value.replace("\\", "/")
    while "/./" in normalized:
        normalized = normalized.replace("/./", "/")
    parts: list[str] = []
    for part in normalized.split("/"):
        if part in {"", "."}:
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    return "/".join(parts)


def _append_link(links: list[GraphLink], added_links: set[tuple[str, str, str]], source: str, target: str, relation: str) -> None:
    link_key = (source, target, relation)
    if link_key in added_links:
        return
    added_links.add(link_key)
    links.append(GraphLink(source=source, target=target, relation=relation, weight=0.8))


def _connect_tag_nodes(
    nodes: list[GraphNode],
    links: list[GraphLink],
    added_nodes: set[str],
    added_links: set[tuple[str, str, str]],
    file_node: GraphNode,
    values: list[str],
    node_type: str,
    relation: str,
) -> None:
    for value in values:
        safe_value = value.strip()
        if not safe_value:
            continue
        node_id = f"{node_type}:{safe_value.lower().replace(' ', '-')}"
        if node_id not in added_nodes:
            nodes.append(
                GraphNode(
                    id=node_id,
                    label=safe_value,
                    type=node_type,
                    domain_tags=file_node.domain_tags,
                    filter_tags={
                        "concepts": [safe_value] if node_type == "concept" else [],
                        "projects": [safe_value] if node_type == "project" else [],
                        "stack": [safe_value] if node_type == "stack" else [],
                        "owners": [safe_value] if node_type == "owner" else [],
                        "learning": [safe_value] if node_type == "learning" else [],
                    },
                    metadata={"name": safe_value, "kind": node_type},
                    size=8.0 if node_type in {"owner", "project", "domain"} else 6.5,
                    color=NODE_COLORS[node_type],
                )
            )
            added_nodes.add(node_id)
        _append_link(links, added_links, file_node.id, node_id, relation)


def _preview(content: str) -> str:
    preview_lines = [line.rstrip() for line in content.splitlines()[:8] if line.strip()]
    return "\n".join(preview_lines)[:600]


def _top_central_files(graph: nx.DiGraph) -> list[dict[str, Any]]:
    file_nodes = [node for node in graph.nodes if node.startswith("file:")]
    if not file_nodes:
        return []
    centrality = nx.degree_centrality(graph)
    ranked = sorted(((node, centrality.get(node, 0.0)) for node in file_nodes), key=lambda item: item[1], reverse=True)[:10]
    return [{"node": node, "score": round(score, 4)} for node, score in ranked]


def _sample_cycles(graph: nx.DiGraph) -> list[list[str]]:
    file_nodes = [node for node in graph.nodes if node.startswith("file:")]
    if not file_nodes or len(file_nodes) > CYCLE_SCAN_LIMIT:
        return []

    file_subgraph = graph.subgraph(file_nodes).copy()
    return [cycle for cycle in islice(nx.simple_cycles(file_subgraph), 20)]