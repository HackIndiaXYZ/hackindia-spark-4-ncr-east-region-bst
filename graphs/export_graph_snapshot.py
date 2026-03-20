from __future__ import annotations

import json
from pathlib import Path

from app.services.graph_builder import build_directory_graph


def main() -> None:
    repo = input("Repo path to graph: ").strip()
    graph = build_directory_graph(repo)
    out_file = Path(__file__).resolve().parent / "sample_graph.json"
    out_file.write_text(json.dumps(graph, indent=2), encoding="utf-8")
    print(f"Wrote graph snapshot: {out_file}")


if __name__ == "__main__":
    main()
