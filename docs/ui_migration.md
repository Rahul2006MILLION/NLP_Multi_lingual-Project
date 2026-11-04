# Streamlit → React/FastAPI Migration

This document records the audit of the original Streamlit UI (`app.py`, removed in this change),
how each feature maps to the new stack, and the architecture that replaces it.

## 1. Audit findings

`app.py` was a self-contained 7-page Streamlit app. It did **not** import anything from `src/`:
every number, example and formula it displayed lived inside `app.py` itself, and every figure
was a pre-rendered PNG from `outputs/`. The GPU pipeline in `src/` (`ModelEngine`,
`ConfidenceEngine`, `src/mitigation/strategies.py`) is used only by the scripts under `scripts/`.

Behaviours worth knowing before comparing old vs new:

| Observation in `app.py` | Consequence |
| --- | --- |
| The "Live Multilingual Demo" never called Gemma. It picked one of 3 curated examples and computed confidences with a closed-form Language-Shift Platt formula over hard-coded constants. | Ported verbatim to `backend/services/demo.py`. It still does not run the model; the UI says so. |
| The "Or Enter Custom Question" text box was rendered but its value (`custom_q`) was never used. | Not carried over: it would be a fake input. Free-text questions need the GPU pipeline (see section 5). |
| The "Generate & Calibrate" button was ignored. Results re-rendered on every widget change. | The button now sends `POST /api/demo/run`, and results come from that response. |
| Strategy B is labelled "(Selected Winner)" on page 2, but page 6 marks Strategy C as the validation winner. | Both labels are kept verbatim. The inconsistency is in the source data, not the migration. |
| Figures fall back to an alternate file when the primary is missing (`get_fig_path`). | The same fallback chain is in `backend/services/assets.py`. A missing figure is hidden, as before. |

## 2. Feature mapping

| # | Streamlit page / widget | New route | API |
| --- | --- | --- | --- |
| 1 | Research Overview: 4 metric cards, abstract, 4 RQ boxes, architecture figure (fig14) | `/` | `GET /api/overview` |
| 2 | Live Demo: language select, benchmark question select, strategy select (default B), τ slider 0.10–0.90 step 0.05, status badge, abstention warning, final answer, 3 confidence metrics with delta, evidence/claims/pivot/arbitration trace | `/demo` | `GET /api/demo/options`, `POST /api/demo/run` |
| 3 | Baseline vs Mitigation: per-language table (acc, gain, relative error reduction, ECE, ECE reduction) and figures 1, 2, 4, 5 with fallbacks | `/comparison` | `GET /api/comparison` |
| 4 | Calibration Analysis: fig7 (fallback), Model 2 LaTeX formula and explanation, fitted parameters, fig6, fig9 (fallback) | `/calibration` | `GET /api/calibration` |
| 5 | Cross-Lingual Consistency: 2 metric cards, fig8 (fallback), qualitative error audit | `/consistency` | `GET /api/consistency` |
| 6 | Strategy Experiments: P_val selection table, figures 10–13 | `/experiments` | `GET /api/experiments` |
| 7 | Report: 4 tabs (paper, methodology, results, limitations) rendered from `docs/*.md` with math; 3 download buttons (metrics CSV, metrics JSON, paper MD) | `/report` | `GET /api/docs/{slug}`, `GET /api/downloads`, `GET /api/downloads/{key}` |
| – | Sidebar: title, model caption, hardware platform, benchmark partitions, footer caption | Footer and nav | `GET /api/meta` |
| – | Figures (`st.image`) | Click any figure to open it in a lightbox | `GET /api/figures/{name}` |

## 3. Architecture

```
frontend/  (React + TypeScript + Vite + Tailwind v4 + Framer Motion + lucide-react)
   │  fetch via src/services/api.ts   (base URL: VITE_API_BASE_URL, dev proxy: VITE_BACKEND_URL)
   ▼
backend/   (FastAPI)
   main.py                 routes and validation (pydantic)
   services/research_data.py   constants moved unchanged out of app.py
   services/demo.py            demo calibration logic moved unchanged out of app.py
   services/assets.py          figure resolution, docs, downloads (paths anchored at the repo root)
   │
   ▼
outputs/, docs/  (artifacts produced by the existing src/ + scripts/ pipeline, untouched)
```

`src/`, `scripts/`, `configs/`, `data/`, `results/` and `outputs/` are unchanged.

## 4. Running

```bash
npm install            # root: installs frontend deps via postinstall
npm run dev            # starts FastAPI on :8000 and Vite on :5173
```

`npm run dev` runs `scripts/dev.mjs`, which starts `python3 -m uvicorn backend.main:app`
(set `PYTHON` to use another interpreter, e.g. a venv) and the Vite dev server.
Backend tests: `pytest backend/tests -q`.

## 5. Not migrated, by design

* **Free-text questions with live Gemma inference.** The original UI never did this.
  `src/mitigation/strategies.py` could support it, but it needs CUDA, bitsandbytes and `HF_TOKEN`.
  It would be a new feature, not a migration.
* **Gemma logo hot-linked from GitHub.** Replaced with a local icon, so the UI makes no third-party requests.
