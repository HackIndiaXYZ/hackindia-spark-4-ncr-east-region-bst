from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

from git import Repo


def clone_repository(repo_url: str, branch: str | None = None) -> tuple[Path, Repo]:
    temp_root = Path(tempfile.gettempdir()) / "codeatlas"
    temp_root.mkdir(parents=True, exist_ok=True)
    repo_dir = temp_root / f"repo-{uuid4().hex}"
    clone_kwargs = {
        "env": {"GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"},
        "multi_options": ["--depth=1", "--single-branch", "--filter=blob:none"],
    }
    if branch and branch.strip():
        clone_kwargs["branch"] = branch.strip()

    repo = Repo.clone_from(repo_url, repo_dir, **clone_kwargs)
    return repo_dir, repo


def cleanup_repository(repo_dir: Path) -> None:
    if repo_dir.exists():
        shutil.rmtree(repo_dir, ignore_errors=True)
