from __future__ import annotations

import asyncio
from collections import Counter

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.api.schemas import ChatRequest, DocsRequest, ExplainRequest, ExplainResponse
from app.services.job_store import job_store

router = APIRouter()


def _node_by_id(job, node_id: str):
    return next((node for node in job.graph.nodes if node.id == node_id), None)


def _top_values(values: list[str], limit: int = 5) -> list[str]:
    cleaned = [value.strip() for value in values if value and value.strip()]
    if not cleaned:
        return []
    return [item for item, _ in Counter(cleaned).most_common(limit)]


def _repo_summary_text(job) -> str:
    graph = job.graph
    repo_name = job.repo.name if job.repo else "repository"
    node_count = len(graph.nodes)
    link_count = len(graph.links)

    file_nodes = [node for node in graph.nodes if node.type == "file"]
    language_values = [str(node.metadata.get("language", "")).strip() for node in file_nodes if isinstance(node.metadata, dict)]
    languages = _top_values([lang for lang in language_values if lang and lang.lower() != "unknown"], 4)

    stack_values: list[str] = []
    concept_values: list[str] = []
    for node in graph.nodes:
        if isinstance(node.filter_tags, dict):
            stack_values.extend(node.filter_tags.get("stack", []))
            concept_values.extend(node.filter_tags.get("concepts", []))

    top_stack = _top_values(stack_values, 5)
    top_concepts = _top_values(concept_values, 5)
    domains = graph.available_domains[:4] if graph.available_domains else []

    lines = [
        f"{repo_name} appears to be a codebase with {node_count} graph nodes and {link_count} dependency links.",
        f"It includes {len(file_nodes)} source file nodes represented in the map.",
    ]

    if languages:
        lines.append(f"Primary languages: {', '.join(languages)}.")
    if top_stack:
        lines.append(f"Likely tech stack/components: {', '.join(top_stack)}.")
    if top_concepts:
        lines.append(f"Key concepts detected: {', '.join(top_concepts)}.")
    if domains:
        lines.append(f"Main architectural domains: {', '.join(domains)}.")

    lines.append("Use the graph filters and node explain/docs tabs to drill into exact modules and responsibilities.")
    return " ".join(lines)


def _node_summary_text(job, node_id: str) -> str:
    node = _node_by_id(job, node_id)
    if not node:
        return "Context node was not found in this job graph."

    deps = [
        (link.target if link.source == node.id else link.source)
        for link in job.graph.links
        if link.source == node.id or link.target == node.id
    ]
    language = str(node.metadata.get("language", "unknown")) if isinstance(node.metadata, dict) else "unknown"
    path = str(node.metadata.get("path", "")) if isinstance(node.metadata, dict) else ""

    summary = [
        f"{node.label} is a {node.type} node",
        f"in domain(s): {', '.join(node.domain_tags) if node.domain_tags else 'general'}",
        f"with {len(deps)} direct graph connections.",
    ]
    if language and language.lower() != "unknown":
        summary.append(f"Language: {language}.")
    if path:
        summary.append(f"Path: {path}.")

    return " ".join(summary)


def _answer_from_fallback(job, request: ChatRequest) -> str:
    prompt = request.message.strip()
    normalized_prompt = prompt.lower()

    overview_triggers = [
        "what does this repo do",
        "what does this repository do",
        "repo do",
        "repository do",
        "purpose",
        "overview",
        "summary",
    ]

    if any(trigger in normalized_prompt for trigger in overview_triggers):
        return _repo_summary_text(job)

    if request.context_node:
        node_summary = _node_summary_text(job, request.context_node)
        if not prompt:
            return node_summary
        return f"{node_summary} Question received: {prompt}."

    if not prompt:
        return _repo_summary_text(job)

    return (
        f"Fallback mode answer for this repository: {_repo_summary_text(job)} "
        f"Question received: {prompt}."
    )


@router.post("/explain", response_model=ExplainResponse)
def explain_node(request: ExplainRequest) -> ExplainResponse:
    job = job_store.get(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.graph:
        raise HTTPException(status_code=409, detail=f"Graph not ready. Current status: {job.status}")

    node = _node_by_id(job, request.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    imports = node.metadata.get("imports") if isinstance(node.metadata, dict) else []
    import_count = len(imports) if isinstance(imports, list) else 0
    language = node.metadata.get("language", "unknown") if isinstance(node.metadata, dict) else "unknown"
    path = node.metadata.get("path", "") if isinstance(node.metadata, dict) else ""

    deps = [
        (link.target if link.source == node.id else link.source)
        for link in job.graph.links
        if link.source == node.id or link.target == node.id
    ][:8]

    responsibilities = [
        f"Belongs to domain(s): {', '.join(node.domain_tags) if node.domain_tags else 'general'}",
        f"Node type: {node.type}",
        f"Connected to {len(deps)} neighboring graph nodes",
    ]
    if language and language != "unknown":
        responsibilities.append(f"Written in {str(language).title()}")
    if import_count:
        responsibilities.append(f"Contains {import_count} import reference(s)")
    if path:
        responsibilities.append(f"Source path: {path}")

    stack = node.filter_tags.get("stack", []) if isinstance(node.filter_tags, dict) else []
    if stack:
        responsibilities.append(f"Technology stack: {', '.join(stack[:5])}")

    concepts = node.filter_tags.get("concepts", []) if isinstance(node.filter_tags, dict) else []
    if concepts:
        responsibilities.append(f"Key concepts: {', '.join(concepts[:5])}")

    return ExplainResponse(
        node_id=node.id,
        summary=(
            f"{node.label} is a {node.type} node located at {path or node.label}. "
            f"It participates in the {', '.join(node.domain_tags[:2]) if node.domain_tags else 'general'} domain(s) of this repository."
        ),
        responsibilities=responsibilities,
        dependencies=deps,
        complexity="high" if len(deps) > 10 else "medium" if len(deps) > 4 else "low",
    )


@router.post("/chat")
def chat_stream(request: ChatRequest):
    job = job_store.get(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.graph:
        raise HTTPException(status_code=409, detail=f"Graph not ready. Current status: {job.status}")

    reply_text = _answer_from_fallback(job, request)

    async def generator():
        for chunk in reply_text.split(" "):
            yield f"{chunk} "
            await asyncio.sleep(0.003)

    return StreamingResponse(generator(), media_type="text/plain")


@router.post("/docs")
def generate_docs(request: DocsRequest):
    job = job_store.get(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.graph:
        raise HTTPException(status_code=409, detail=f"Graph not ready. Current status: {job.status}")

    node = _node_by_id(job, request.node_id)

    if not node:
        label_lower = request.node_id.lower().replace("file:", "").split("/")[-1]
        matches = [n for n in job.graph.nodes if label_lower in n.label.lower()]
        node = matches[0] if matches else None

    if not node:
        return {
            "job_id": request.job_id,
            "node_id": request.node_id,
            "markdown": f"# Not Found\n\nNo node matching `{request.node_id}` was found in the graph.",
        }

    connected_ids: list[str] = []
    incoming_ids: list[str] = []
    outgoing_ids: list[str] = []
    for link in job.graph.links:
        if link.source == node.id:
            outgoing_ids.append(link.target)
        elif link.target == node.id:
            incoming_ids.append(link.source)

    connected_ids = list(dict.fromkeys(incoming_ids + outgoing_ids))[:10]
    _ = [n for n in job.graph.nodes if n.id in connected_ids]

    path = node.metadata.get("path", node.label) if isinstance(node.metadata, dict) else node.label
    language = node.metadata.get("language", "unknown") if isinstance(node.metadata, dict) else "unknown"
    imports_raw = node.metadata.get("imports", []) if isinstance(node.metadata, dict) else []
    imports = imports_raw if isinstance(imports_raw, list) else []
    preview = node.metadata.get("preview", "") if isinstance(node.metadata, dict) else ""

    stack = node.filter_tags.get("stack", []) if isinstance(node.filter_tags, dict) else []
    concepts = node.filter_tags.get("concepts", []) if isinstance(node.filter_tags, dict) else []
    projects = node.filter_tags.get("projects", []) if isinstance(node.filter_tags, dict) else []
    learning = node.filter_tags.get("learning", []) if isinstance(node.filter_tags, dict) else []

    lines: list[str] = [
        f"# {node.label}",
        "",
        f"> **Type:** `{node.type}` &nbsp;|&nbsp; **Language:** `{language}` &nbsp;|&nbsp; **Domain(s):** {', '.join(f'`{d}`' for d in node.domain_tags) if node.domain_tags else '`general`'}",
        "",
        "## Overview",
        "",
        f"**File path:** `{path}`",
        "",
    ]

    if concepts:
        lines += ["## Key Concepts", "", *[f"- {c}" for c in concepts[:8]], ""]

    if stack:
        lines += ["## Technology Stack", "", *[f"- `{s}`" for s in stack[:8]], ""]

    if imports:
        lines += [f"## Imports ({len(imports)})", "", *[f"- `{imp}`" for imp in imports[:12]]]
        if len(imports) > 12:
            lines.append(f"- *...and {len(imports) - 12} more*")
        lines.append("")

    if outgoing_ids:
        out_nodes = [n for n in job.graph.nodes if n.id in outgoing_ids[:6]]
        lines += ["## Outgoing Dependencies", "", *[f"- `{n.label}` ({n.type})" for n in out_nodes], ""]

    if incoming_ids:
        in_nodes = [n for n in job.graph.nodes if n.id in incoming_ids[:6]]
        lines += ["## Used By", "", *[f"- `{n.label}` ({n.type})" for n in in_nodes], ""]

    if learning:
        lines += [
            "## Learning Resources",
            "",
            *[f"- [{l}](https://www.google.com/search?q={l.replace(' ', '+')}+tutorial)" for l in learning[:5]],
            "",
        ]

    if projects:
        lines += ["## Project Tags", "", *[f"- `{p}`" for p in projects[:4]], ""]

    if preview:
        lines += ["## Code Preview", "", f"```{language}", preview.strip()[:800], "```", ""]

    return {"job_id": request.job_id, "node_id": request.node_id, "markdown": "\n".join(lines)}


@router.get("/docs/{job_id}/{module}")
def generate_docs_legacy(job_id: str, module: str):
    return generate_docs(DocsRequest(job_id=job_id, node_id=module))
