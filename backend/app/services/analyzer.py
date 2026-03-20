from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from pathlib import Path

CODE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs", ".md"}


@dataclass
class RepoSummary:
    total_files: int
    total_lines: int
    top_extensions: list[tuple[str, int]]
    hottest_files: list[tuple[str, int]]
    project_type: str
    focus_modules: list[tuple[str, int]]
    observations: list[str]
    technical_metrics: dict[str, int | float]


def _iter_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part.startswith(".") and part != ".github" for part in path.parts):
            continue
        if "node_modules" in path.parts or "__pycache__" in path.parts:
            continue
        yield path


def summarize_repository(repo_path: str) -> RepoSummary:
    root = Path(repo_path).resolve()
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Repository path not found: {repo_path}")

    ext_counter: Counter[str] = Counter()
    line_counter: list[tuple[str, int]] = []
    total_lines = 0
    total_files = 0

    for file_path in _iter_files(root):
        total_files += 1
        ext = file_path.suffix.lower() or "[noext]"
        ext_counter[ext] += 1

        if ext in CODE_EXTENSIONS:
            try:
                lines = len(file_path.read_text(encoding="utf-8", errors="ignore").splitlines())
            except OSError:
                lines = 0
            total_lines += lines
            rel = str(file_path.relative_to(root))
            line_counter.append((rel, lines))

    hottest_files = sorted(line_counter, key=lambda x: x[1], reverse=True)[:8]
    top_extensions = ext_counter.most_common(8)

    folder_counter: Counter[str] = Counter()
    for file_path, _ in line_counter:
        folder = file_path.split("/")[0] if "/" in file_path else "root"
        folder_counter[folder] += 1
    focus_modules = folder_counter.most_common(6)

    ext_names = {ext for ext, _ in top_extensions}
    if {".tsx", ".ts"} & ext_names and ".py" in ext_names:
        project_type = "fullstack-web"
    elif ".py" in ext_names:
        project_type = "python-backend"
    elif {".ts", ".tsx", ".js", ".jsx"} & ext_names:
        project_type = "frontend-js"
    else:
        project_type = "mixed-repo"

    observations: list[str] = []
    if total_files > 800:
        observations.append("High file count may affect indexing and graph traversal latency")
    if total_lines > 50000:
        observations.append("Large codebase detected; module-scoped passes are recommended")
    if not observations:
        observations.append("No high-risk structural indicators detected in current scan")

    code_file_count = len(line_counter)
    large_file_count = len([1 for _, lines in line_counter if lines >= 400])
    avg_lines_per_code_file = round(total_lines / code_file_count, 2) if code_file_count else 0.0
    technical_metrics: dict[str, int | float] = {
        "code_file_count": code_file_count,
        "large_file_count_ge_400": large_file_count,
        "avg_lines_per_code_file": avg_lines_per_code_file,
    }

    return RepoSummary(
        total_files=total_files,
        total_lines=total_lines,
        top_extensions=top_extensions,
        hottest_files=hottest_files,
        project_type=project_type,
        focus_modules=focus_modules,
        observations=observations,
        technical_metrics=technical_metrics,
    )
def analyze_repository(repo_path: str) -> RepoSummary:
    path = Path(repo_path)

    files = list(iter_files(path))
    total_files = len(files)
    total_lines = 0

    ext_counter = Counter()

    for file in files:
        ext = file.suffix
        ext_counter[ext] += 1

        try:
            with open(file, "r", encoding="utf-8", errors="ignore") as f:
                total_lines += len(f.readlines())
        except:
            pass

    return RepoSummary(
        total_files=total_files,
        total_lines=total_lines,
        top_extensions=ext_counter.most_common(5),
        hottest_files=[],
        project_type="unknown",
        focus_modules=[],
        observations=[],
        technical_metrics={}
    )