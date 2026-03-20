from __future__ import annotations

from collections import Counter
from pathlib import Path


def build_directory_graph(repo_path: str) -> dict:
    root = Path(repo_path).resolve()
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Repository path not found: {repo_path}")

    nodes = [{"id": str(root.name), "type": "root"}]
    links = []
    folder_counter: Counter[str] = Counter()

    for path in root.rglob("*"):
        if "node_modules" in path.parts or "__pycache__" in path.parts:
            continue
        rel = path.relative_to(root)
        if rel == Path("."):
            continue

        node_id = str(rel).replace("\\", "/")
        parent = str(rel.parent).replace("\\", "/") if rel.parent != Path(".") else root.name

        node_type = "file" if path.is_file() else "folder"
        nodes.append({"id": node_id, "type": node_type})
        links.append({"source": parent, "target": node_id})

        if path.is_file() and rel.parts:
            folder_counter[rel.parts[0]] += 1

    focus_clusters = [
        {"module": name, "file_count": count}
        for name, count in folder_counter.most_common(6)
    ]

    return {
        "node_count": len(nodes),
        "edge_count": len(links),
        "focus_clusters": focus_clusters,
        "nodes": nodes[:300],
        "links": links[:600],
        "note": "Capped for hackathon prototype responsiveness",
    }
