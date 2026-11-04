"""
Demo calibration logic, moved unchanged out of the original Streamlit ``app.py`` (page 2).

The demo does not call Gemma. It selects a curated answer and applies the Model 2
Language-Shift Platt formula to the stored verbalized confidence, exactly as the Streamlit app did.
"""

from typing import Any, Dict

import numpy as np

from backend.services.research_data import (
    BASELINE_DATA,
    CURATED_EXAMPLES,
    LANGUAGES,
    PLATT_DELTA,
    PLATT_INTERCEPT_B0,
    PLATT_SLOPE_W,
)


def compute_confidences(lang: str, strategy: str, tau: float) -> Dict[str, Any]:
    """Raw verbalized, statistical and Model 2 calibrated confidence plus abstention decision."""
    base_stat = BASELINE_DATA[lang]["c_s"]
    raw_v_conf = BASELINE_DATA[lang]["c_v"] if strategy in ("baseline", "A") else 0.950

    z = np.log(raw_v_conf / (1.0 - raw_v_conf)) if raw_v_conf < 1.0 else 3.5
    cal_conf = 1.0 / (1.0 + np.exp(-(PLATT_SLOPE_W * z + PLATT_INTERCEPT_B0 + PLATT_DELTA[lang])))
    if strategy in ("B", "C"):
        cal_conf = min(0.92, cal_conf + 0.35)  # Pivot boosts factual certainty

    is_abstained = bool(cal_conf < tau) if strategy == "E" else False
    return {
        "raw_verbalized": float(raw_v_conf),
        "statistical": float(base_stat),
        "calibrated": float(cal_conf),
        "delta_vs_raw": float(cal_conf - raw_v_conf),
        "is_abstained": is_abstained,
    }


def run_demo(lang: str, example_index: int, strategy: str, tau: float) -> Dict[str, Any]:
    ex = CURATED_EXAMPLES[example_index]
    target_answer = ex["answers"].get(lang, ex["answers"]["en"])
    conf = compute_confidences(lang, strategy, tau)

    trace = []
    note = None
    if strategy == "B":
        trace = [
            {"label": "Stage 1 English Pivot Candidate (High Competence)", "text": ex["answers"]["en"]},
            {"label": "Stage 2 Fluent Target Translation", "text": target_answer},
        ]
        note = "Factual correctness anchored in English where model accuracy is 95.6%."
    elif strategy == "C":
        trace = [
            {"label": "Candidate 1 (Direct Native)", "text": target_answer},
            {"label": "Candidate 2 (English Pivot Translated)", "text": target_answer},
        ]
        note = "Bilingual arbitration verified agreement between native and English candidates."

    return {
        "question_id": ex["id"],
        "question_en": ex["question_en"],
        "domain": ex["domain"],
        "language": lang,
        "language_name": LANGUAGES[lang]["name"],
        "strategy": strategy,
        "tau": tau,
        "status": "abstained" if conf["is_abstained"] else "delivered",
        "final_answer": None if conf["is_abstained"] else target_answer,
        "confidence": conf,
        "evidence": ex["evidence"],
        "claims": ex["claims"],
        "trace": trace,
        "trace_note": note,
    }
