"""API tests. The demo is checked against a verbatim copy of the original Streamlit computation."""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.research_data import BASELINE_DATA, CURATED_EXAMPLES, STRATEGIES

client = TestClient(app)

STREAMLIT_LABELS = {s["key"]: s["label"] for s in STRATEGIES}


def streamlit_reference(lang_choice, strat_choice, tau_thresh):
    """Copied from app.py (page 2) before removal; operates on the original label strings."""
    base_stat = BASELINE_DATA[lang_choice]["c_s"]
    raw_v_conf = BASELINE_DATA[lang_choice]["c_v"] if "Baseline" in strat_choice or "Strategy A" in strat_choice else 0.950
    delta_l = {"en": 0.0, "hi": -2.148, "bn": -1.684, "te": -2.095, "ta": -1.512}[lang_choice]
    z = np.log(raw_v_conf / (1.0 - raw_v_conf)) if raw_v_conf < 1.0 else 3.5
    cal_conf = 1.0 / (1.0 + np.exp(-(0.892 * z + 1.412 + delta_l)))
    if "Strategy B" in strat_choice or "Strategy C" in strat_choice:
        cal_conf = min(0.92, cal_conf + 0.35)
    is_abstained = cal_conf < tau_thresh if "Strategy E" in strat_choice else False
    return raw_v_conf, base_stat, cal_conf, is_abstained


TAUS = [round(0.10 + 0.05 * i, 2) for i in range(17)]


@pytest.mark.parametrize("lang", list(BASELINE_DATA))
@pytest.mark.parametrize("strategy", list(STREAMLIT_LABELS))
@pytest.mark.parametrize("example_index", range(len(CURATED_EXAMPLES)))
def test_demo_matches_streamlit(lang, strategy, example_index):
    for tau in TAUS:
        r = client.post("/api/demo/run", json={"language": lang, "example_index": example_index, "strategy": strategy, "tau": tau})
        assert r.status_code == 200
        body = r.json()
        raw, stat, cal, abst = streamlit_reference(lang, STREAMLIT_LABELS[strategy], tau)
        c = body["confidence"]
        assert c["raw_verbalized"] == pytest.approx(raw)
        assert c["statistical"] == pytest.approx(stat)
        assert c["calibrated"] == pytest.approx(cal)
        assert c["is_abstained"] == bool(abst)
        ex = CURATED_EXAMPLES[example_index]
        expected_answer = None if abst else ex["answers"][lang]
        assert body["final_answer"] == expected_answer
        assert body["evidence"] == ex["evidence"]
        assert len(body["trace"]) == (2 if strategy in ("B", "C") else 0)


def test_demo_e_abstains_at_high_tau():
    r = client.post("/api/demo/run", json={"language": "hi", "example_index": 0, "strategy": "E", "tau": 0.9}).json()
    assert r["status"] == "abstained" and r["final_answer"] is None


@pytest.mark.parametrize("payload", [
    {"language": "xx", "example_index": 0, "strategy": "B", "tau": 0.5},
    {"language": "en", "example_index": 3, "strategy": "B", "tau": 0.5},
    {"language": "en", "example_index": 0, "strategy": "Z", "tau": 0.5},
    {"language": "en", "example_index": 0, "strategy": "B", "tau": 0.95},
])
def test_demo_validation(payload):
    assert client.post("/api/demo/run", json=payload).status_code == 422


def test_comparison_rows_match_streamlit_formatting():
    rows = {r["code"]: r for r in client.get("/api/comparison").json()["rows"]}
    hi = rows["hi"]
    assert f"{hi['accuracy_gain_pp']:+.1f} pp" == "+60.6 pp"
    assert f"{hi['rel_error_reduction']:.1f}%" == "79.6%"
    assert f"{hi['ece_reduction']:.1f}%" == "27.9%"
    assert rows["en"]["rel_error_reduction"] is None


@pytest.mark.parametrize("path", ["/api/overview", "/api/comparison", "/api/calibration", "/api/consistency", "/api/experiments"])
def test_pages_resolve_all_figures(path):
    figs = client.get(path).json()["figures"]
    assert figs and all(f is not None for f in figs.values())
    for f in figs.values():
        r = client.get(f["url"])
        assert r.status_code == 200 and r.headers["content-type"] == "image/png"


def test_figure_traversal_rejected():
    assert client.get("/api/figures/..%2F..%2FREADME.md").status_code == 404
    assert client.get("/api/figures/nope.png").status_code == 404


@pytest.mark.parametrize("slug", ["paper", "methodology", "results", "limitations"])
def test_docs(slug):
    body = client.get(f"/api/docs/{slug}").json()
    assert body["available"] and body["markdown"].startswith("#")


def test_downloads():
    items = client.get("/api/downloads").json()
    assert len(items) == 3 and all(i["available"] for i in items)
    r = client.get("/api/downloads/metrics_csv")
    assert r.status_code == 200 and "attachment" in r.headers["content-disposition"]
    assert client.get("/api/downloads/unknown").status_code == 404
