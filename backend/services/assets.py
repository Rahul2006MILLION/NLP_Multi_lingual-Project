"""File-backed artifacts: figures, markdown docs and downloads. Paths are anchored at the repo root."""

from pathlib import Path
from typing import Dict, List, Optional

from backend.services.research_data import DOCS, DOWNLOADS, FIGURES

ROOT = Path(__file__).resolve().parents[2]
FIGURE_DIRS = [ROOT / "outputs/mitigation_results/figures", ROOT / "outputs/research_results"]


def get_fig_path(filename: str) -> Optional[Path]:
    """Same lookup order as the original Streamlit helper."""
    if "/" in filename or "\\" in filename or filename.startswith("."):
        return None
    for d in FIGURE_DIRS:
        p = d / filename
        if p.is_file():
            return p
    return None


def resolve_figure(slot: str) -> Optional[Dict[str, str]]:
    primary, fallback, caption = FIGURES[slot]
    for name in (primary, fallback):
        if name and get_fig_path(name):
            return {"url": f"/api/figures/{name}", "caption": caption, "filename": name}
    return None


def resolve_figures(slots: List[str]) -> Dict[str, Optional[Dict[str, str]]]:
    return {s: resolve_figure(s) for s in slots}


def read_doc(slug: str) -> Optional[str]:
    p = ROOT / DOCS[slug]["path"]
    return p.read_text(encoding="utf-8") if p.is_file() else None


def download_path(key: str) -> Optional[Path]:
    p = ROOT / DOWNLOADS[key]["path"]
    return p if p.is_file() else None
