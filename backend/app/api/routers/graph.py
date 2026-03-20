from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.job_store import job_store

router = APIRouter()


@router.get("/{job_id}")
def get_graph(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status.value != "done" or not job.graph:
        raise HTTPException(status_code=409, detail=f"Graph not ready. Current status: {job.status}")

    return {
        "job_id": job.job_id,
        "repo": job.repo,
        "graph": job.graph,
        "status": job.status,
    }


@router.get("/{job_id}/summary")
def get_graph_summary(job_id: str):
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status.value != "done" or not job.graph:
        raise HTTPException(status_code=409, detail=f"Graph not ready. Current status: {job.status}")

    return {
        "job_id": job.job_id,
        "repo": job.repo,
        "stats": job.graph.stats,
        "available_domains": job.graph.available_domains,
        "available_filters": job.graph.available_filters,
        "node_count": len(job.graph.nodes),
        "link_count": len(job.graph.links),
    }
