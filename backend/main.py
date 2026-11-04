"""
FastAPI layer between the React frontend and the research artifacts / demo logic.

Run: python3 -m uvicorn backend.main:app --port 8000 --reload
"""

import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator

from backend.services import assets, demo
from backend.services.research_data import (
    BASELINE_DATA,
    CALIBRATION,
    COMPARISON,
    CONSISTENCY,
    CURATED_EXAMPLES,
    DEFAULT_STRATEGY,
    DOCS,
    DOWNLOADS,
    EXPERIMENTS,
    LANGUAGES,
    META,
    OVERVIEW,
    PLATT_DELTA,
    PLATT_INTERCEPT_B0,
    PLATT_SLOPE_W,
    STRATEGIES,
    TAU,
)

app = FastAPI(title="Cross-Lingual Calibration API", version="1.0.0")

_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

LangCode = Literal["en", "hi", "bn", "te", "ta"]
StrategyKey = Literal["baseline", "A", "B", "C", "D", "E"]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/meta")
def meta():
    return {**META, "languages": LANGUAGES}


@app.get("/api/overview")
def overview():
    return {**OVERVIEW, "figures": assets.resolve_figures(["architecture"])}


# ---- Live demo ---------------------------------------------------------------

@app.get("/api/demo/options")
def demo_options():
    return {
        "languages": [{"code": k, **v} for k, v in LANGUAGES.items()],
        "examples": [
            {"index": i, "id": ex["id"], "domain": ex["domain"], "question_en": ex["question_en"]}
            for i, ex in enumerate(CURATED_EXAMPLES)
        ],
        "strategies": STRATEGIES,
        "default_strategy": DEFAULT_STRATEGY,
        "tau": TAU,
    }


class DemoRequest(BaseModel):
    language: LangCode
    example_index: int = Field(ge=0)
    strategy: StrategyKey
    tau: float = Field(ge=TAU["min"], le=TAU["max"])

    @field_validator("example_index")
    @classmethod
    def _example_in_range(cls, v: int) -> int:
        if v >= len(CURATED_EXAMPLES):
            raise ValueError(f"example_index must be < {len(CURATED_EXAMPLES)}")
        return v


@app.post("/api/demo/run")
def demo_run(req: DemoRequest):
    return demo.run_demo(req.language, req.example_index, req.strategy, req.tau)


# ---- Analysis pages ----------------------------------------------------------

@app.get("/api/comparison")
def comparison():
    rows = []
    for l, d in BASELINE_DATA.items():
        rows.append({
            "code": l,
            "language": LANGUAGES[l]["name"],
            "baseline_acc": d["acc"],
            "mitigated_acc": d["mit_acc"],
            "accuracy_gain_pp": (d["mit_acc"] - d["acc"]) * 100,
            "rel_error_reduction": (((1.0 - d["acc"]) - (1.0 - d["mit_acc"])) / (1.0 - d["acc"]) * 100) if l != "en" else None,
            "baseline_ece": d["ece"],
            "mitigated_ece": d["mit_ece"],
            "ece_reduction": (d["ece"] - d["mit_ece"]) / d["ece"] * 100,
        })
    return {**COMPARISON, "rows": rows, "figures": assets.resolve_figures(["fig1", "fig2", "fig4", "fig5"])}


@app.get("/api/calibration")
def calibration():
    params = [{"name": "Shared Slope (w)", "value": PLATT_SLOPE_W}, {"name": "Base Intercept (b0)", "value": PLATT_INTERCEPT_B0}]
    params += [{"name": f"δ_{LANGUAGES[k]['name']}", "value": v, "reference": k == "en"} for k, v in PLATT_DELTA.items()]
    return {**CALIBRATION, "parameters": params, "figures": assets.resolve_figures(["fig7", "fig6", "fig9"])}


@app.get("/api/consistency")
def consistency():
    return {**CONSISTENCY, "figures": assets.resolve_figures(["fig8"])}


@app.get("/api/experiments")
def experiments():
    return {**EXPERIMENTS, "figures": assets.resolve_figures(["fig10", "fig11", "fig12", "fig13"])}


# ---- Files -------------------------------------------------------------------

@app.get("/api/figures/{name}")
def figure(name: str):
    p = assets.get_fig_path(name)
    if not p:
        raise HTTPException(404, "Figure not found")
    return FileResponse(p, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})


@app.get("/api/docs")
def docs_index():
    return [{"slug": k, "label": v["label"]} for k, v in DOCS.items()]


@app.get("/api/docs/{slug}")
def doc(slug: str):
    if slug not in DOCS:
        raise HTTPException(404, "Unknown document")
    text = assets.read_doc(slug)
    return {"slug": slug, "label": DOCS[slug]["label"], "available": text is not None,
            "markdown": text, "missing_note": DOCS[slug]["missing_note"]}


@app.get("/api/downloads")
def downloads_index():
    return [{"key": k, "label": v["label"], "filename": v["filename"],
             "available": assets.download_path(k) is not None, "url": f"/api/downloads/{k}"}
            for k, v in DOWNLOADS.items()]


@app.get("/api/downloads/{key}")
def download(key: str):
    if key not in DOWNLOADS:
        raise HTTPException(404, "Unknown download")
    p = assets.download_path(key)
    if not p:
        raise HTTPException(404, "File not available")
    d = DOWNLOADS[key]
    return FileResponse(p, media_type=d["mime"], filename=d["filename"])
