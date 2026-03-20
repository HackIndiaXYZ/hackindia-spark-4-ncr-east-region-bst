from __future__ import annotations

from collections import Counter
import math
from pathlib import Path
import re

TOKEN_RE = re.compile(r"[a-zA-Z_][a-zA-Z0-9_]+")
ALLOWED_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".yml", ".yaml"}


def _vectorize(text: str) -> Counter[str]:
    return Counter(token.lower() for token in TOKEN_RE.findall(text))


def _cosine_similarity(a: Counter[str], b: Counter[str]) -> float:
    if not a or not b:
        return 0.0

    common = set(a) & set(b)
    numerator = sum(a[token] * b[token] for token in common)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return numerator / (norm_a * norm_b)


def rank_files_by_prompt(prompt: str, documents: list[dict]) -> list[dict]:
    prompt_vec = _vectorize(prompt)
    ranked = []

    for doc in documents:
        content = doc.get("content", "")
        path = doc.get("path", "unknown")
        score = _cosine_similarity(prompt_vec, _vectorize(content))
        ranked.append({"path": path, "score": round(score, 4)})

    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:10]


def build_documents_from_repository(repo_path: str, max_files: int = 120) -> list[dict]:
    root = Path(repo_path).resolve()
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Repository path not found: {repo_path}")

    docs: list[dict] = []
    count = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        if "node_modules" in path.parts or "__pycache__" in path.parts:
            continue
        if any(part.startswith(".") and part != ".github" for part in path.parts):
            continue

        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        docs.append(
            {
                "path": str(path.relative_to(root)).replace("\\", "/"),
                "content": content[:6000],
            }
        )
        count += 1
        if count >= max_files:
            break

    return docs
