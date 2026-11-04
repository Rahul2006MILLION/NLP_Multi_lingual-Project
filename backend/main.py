"""
FastAPI layer between the React frontend and the research artifacts / demo logic.

Run: python3 -m uvicorn backend.main:app --port 8000 --reload
"""

import os
from typing import Literal, Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator

from backend.services import assets, demo
from backend.services.ollama_service import ollama
from backend.services.nlp_pipeline import run_uncertainty_pipeline
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


# ---- Live demo & Ollama endpoints ---------------------------------------------

@app.get("/api/ollama/status")
def ollama_status():
    status = ollama.check_connection()
    models = ollama.list_installed_models()
    return {
        "connected": status["connected"],
        "base_url": status.get("base_url"),
        "models": models,
        "default_model": models[0] if models else None,
        "error": status.get("error"),
    }


# ---- Direct Chat with Gemma 3 4B ----------------------------------------------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gemma3:4b"
    stream: Optional[bool] = True
    temperature: Optional[float] = 0.7


@app.get("/api/chat/status")
def chat_status():
    status = ollama.check_connection()
    raw_models = status.get("raw_models", [])
    models = [m.get("name") for m in raw_models if m.get("name")]
    target = "gemma3:4b"
    is_available = target in models or any(m.startswith("gemma3:4b") for m in models)
    return {
        "connected": status["connected"],
        "target_model": target,
        "is_available": is_available,
        "models": models,
        "error": status.get("error"),
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    status = ollama.check_connection()
    if not status["connected"]:
        raise HTTPException(
            status_code=503,
            detail=f"Local Ollama is not running at {ollama.base_url}. Please ensure Ollama is started."
        )

    target_model = req.model or "gemma3:4b"
    raw_models = status.get("raw_models", [])
    installed_names = [m.get("name") for m in raw_models if m.get("name")]
    if target_model not in installed_names and not any(m.startswith(target_model) for m in installed_names):
        raise HTTPException(
            status_code=404,
            detail=f"Model '{target_model}' is not installed in local Ollama. Available models: {', '.join(installed_names)}"
        )

    messages_data = [m.model_dump() for m in req.messages]

    if req.stream:
        return StreamingResponse(
            ollama.chat_stream(
                messages=messages_data,
                model=target_model,
                temperature=req.temperature if req.temperature is not None else 0.7,
            ),
            media_type="text/event-stream",
        )
    else:
        return ollama.chat(
            messages=messages_data,
            model=target_model,
            temperature=req.temperature if req.temperature is not None else 0.7,
        )


@app.get("/api/demo/options")
def demo_options():
    status = ollama.check_connection()
    models = ollama.list_installed_models()
    return {
        "languages": [{"code": k, **v} for k, v in LANGUAGES.items()],
        "examples": [
            {"index": i, "id": ex["id"], "domain": ex["domain"], "question_en": ex["question_en"]}
            for i, ex in enumerate(CURATED_EXAMPLES)
        ],
        "strategies": STRATEGIES,
        "default_strategy": DEFAULT_STRATEGY,
        "tau": TAU,
        "ollama": {
            "connected": status["connected"],
            "models": models,
            "default_model": models[0] if models else None,
            "error": status.get("error"),
        },
    }


class DemoRequest(BaseModel):
    language: LangCode
    example_index: Optional[int] = Field(default=0, ge=0)
    strategy: StrategyKey
    tau: float = Field(ge=TAU["min"], le=TAU["max"])
    model: Optional[str] = "gemma3:4b"
    custom_question: Optional[str] = None
    use_reference: Optional[bool] = False
    num_generations: Optional[int] = Field(default=4, ge=1, le=10)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=128, ge=16, le=512)
    adaptive_sampling: Optional[bool] = True

    @field_validator("example_index")
    @classmethod
    def _example_in_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v >= len(CURATED_EXAMPLES):
            raise ValueError(f"example_index must be < {len(CURATED_EXAMPLES)}")
        return v


@app.post("/api/demo/run")
def demo_run(req: DemoRequest):
    # 1. If explicitly requested reference / benchmark mode without LLM
    if req.use_reference or req.model == "reference":
        q_idx = req.example_index if req.example_index is not None else 0
        return demo.run_demo(req.language, q_idx, req.strategy, req.tau)

    # 2. Live inference with local Gemma 3 4B
    selected_model = req.model or "gemma3:4b"
    ollama_conn = ollama.check_connection()

    if not ollama_conn["connected"]:
        raise HTTPException(
            status_code=503,
            detail=f"Local Ollama is not running at {ollama.base_url}. Please ensure Ollama is started with 'ollama serve'."
        )

    # Verify model availability
    raw_models = ollama_conn.get("raw_models", [])
    installed_names = [m.get("name") for m in raw_models if m.get("name")] or ollama_conn.get("models", []) or ollama.list_installed_models()
    if selected_model not in installed_names and not any(m.startswith(selected_model) for m in installed_names):
        raise HTTPException(
            status_code=404,
            detail=f"Model '{selected_model}' is not installed locally in Ollama. Available models: {', '.join(installed_names)}"
        )

    # Resolve question, evidence, and claims
    q_idx = req.example_index if req.example_index is not None else 0
    ex = CURATED_EXAMPLES[q_idx] if q_idx < len(CURATED_EXAMPLES) else CURATED_EXAMPLES[0]
    lang_info = LANGUAGES.get(req.language, LANGUAGES["en"])
    lang_name = lang_info["name"]

    if req.custom_question and req.custom_question.strip():
        question_text = req.custom_question.strip()
        benchmark_id = None
        evidence = f"User custom question. Evaluated live via local Gemma 3 4B research pipeline."
        claims = [question_text]
    else:
        question_text = ex["question_en"]
        benchmark_id = ex["id"]
        evidence = ex["evidence"]
        claims = ex["claims"]

    # STEP 1 & 2: Send question directly to the shared Chat/Gemma 3 4B inference service
    chat_prompt = (
        f"Answer the following question concisely in {lang_name} ({lang_info['native']}):\n{question_text}"
        if req.language != "en"
        else question_text
    )
    chat_messages = [{"role": "user", "content": chat_prompt}]

    try:
        # STEP 3: Obtain actual generated response from Gemma 3 4B via the Chat inference service
        chat_result = ollama.chat(
            messages=chat_messages,
            model=selected_model,
            temperature=req.temperature if req.temperature is not None else 0.7,
            top_p=req.top_p if req.top_p is not None else 0.9,
            max_tokens=req.max_tokens or 128,
        )
        initial_chat_response = chat_result.get("response", "").strip()

        # STEP 4-7: Pass actual generated response into the EXISTING NLP research pipeline
        return run_uncertainty_pipeline(
            model=selected_model,
            language=req.language,
            question_text=question_text,
            strategy=req.strategy,
            tau=req.tau,
            benchmark_id=benchmark_id,
            ground_truth_evidence=evidence,
            ground_truth_claims=claims,
            num_generations=req.num_generations or 4,
            temperature=req.temperature if req.temperature is not None else 0.7,
            top_p=req.top_p if req.top_p is not None else 0.9,
            max_tokens=req.max_tokens or 128,
            adaptive_sampling=req.adaptive_sampling if req.adaptive_sampling is not None else True,
            initial_chat_response=initial_chat_response,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemma 3 4B Live Pipeline error with model '{selected_model}': {str(e)}"
        )


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
