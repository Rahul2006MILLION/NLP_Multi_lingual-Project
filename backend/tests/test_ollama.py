"""
Test suite covering Phase 12 test cases for Ollama integration,
uncertainty evaluation, feature extraction, adaptive sampling, and API endpoints.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.ollama_service import OllamaService
from backend.services.nlp_pipeline import (
    jaccard_similarity,
    compute_semantic_entropy,
    run_uncertainty_pipeline,
)

client = TestClient(app)


# 1 & 2: Ollama is running vs Ollama is unavailable
def test_case_01_ollama_status_running():
    with patch.object(OllamaService, "check_connection") as mock_conn, \
         patch.object(OllamaService, "list_installed_models") as mock_models:
        mock_conn.return_value = {"connected": True, "base_url": "http://localhost:11434"}
        mock_models.return_value = ["qwen2.5:3b", "qwen3:4b"]

        res = client.get("/api/ollama/status")
        assert res.status_code == 200
        data = res.json()
        assert data["connected"] is True
        assert len(data["models"]) == 2


def test_case_02_ollama_unavailable():
    with patch.object(OllamaService, "check_connection") as mock_conn:
        mock_conn.return_value = {"connected": False, "error": "Connection refused"}

        # Requesting a model when Ollama is unavailable should return 503
        res = client.post("/api/demo/run", json={
            "language": "en",
            "strategy": "baseline",
            "tau": 0.5,
            "model": "qwen3:4b",
        })
        assert res.status_code == 503
        assert "not running" in res.json()["detail"]


# 3: Multiple installed models dynamic retrieval
def test_case_03_multiple_installed_models():
    with patch.object(OllamaService, "check_connection") as mock_conn, \
         patch.object(OllamaService, "list_installed_models") as mock_models:
        mock_conn.return_value = {"connected": True, "base_url": "http://localhost:11434"}
        mock_models.return_value = ["qwen2.5:3b", "qwen3:4b", "mistral:7b"]

        res = client.get("/api/demo/options")
        assert res.status_code == 200
        ollama_info = res.json().get("ollama")
        assert ollama_info["connected"] is True
        assert "mistral:7b" in ollama_info["models"]


# 4 & 5: Custom question input vs Benchmark question input
def test_case_04_custom_question_input():
    with patch("backend.main.run_uncertainty_pipeline") as mock_pipeline, \
         patch.object(OllamaService, "check_connection") as mock_conn, \
         patch.object(OllamaService, "list_installed_models") as mock_models:
        mock_conn.return_value = {"connected": True, "models": ["qwen2.5:3b"], "raw_models": [{"name": "qwen2.5:3b"}]}
        mock_models.return_value = ["qwen2.5:3b"]
        mock_pipeline.return_value = {
            "status": "delivered",
            "final_answer": "Autonomous mobile robots improve warehouse picking speed.",
            "confidence": {"raw_verbalized": 0.85, "statistical": 0.80, "calibrated": 0.88, "delta_vs_raw": 0.03, "is_abstained": False},
            "trace": [],
        }

        res = client.post("/api/demo/run", json={
            "language": "en",
            "strategy": "baseline",
            "tau": 0.5,
            "model": "qwen2.5:3b",
            "custom_question": "What are the benefits of warehouse automation?",
        })
        assert res.status_code == 200
        mock_pipeline.assert_called_once()
        args, kwargs = mock_pipeline.call_args
        assert kwargs["question_text"] == "What are the benefits of warehouse automation?"


def test_case_05_benchmark_question_input():
    # With reference model, tests pre-computed logic
    res = client.post("/api/demo/run", json={
        "language": "hi",
        "example_index": 0,
        "strategy": "baseline",
        "tau": 0.5,
        "model": "reference",
    })
    assert res.status_code == 200
    assert "बेंगलुरु" in res.json()["final_answer"]


# 6 & 7: English question vs Indic question
def test_case_06_english_question():
    res = client.post("/api/demo/run", json={
        "language": "en",
        "example_index": 0,
        "strategy": "baseline",
        "tau": 0.5,
        "model": "reference",
    })
    assert res.status_code == 200
    assert "Bengaluru" in res.json()["final_answer"]


def test_case_07_other_supported_languages():
    for lang in ["bn", "te", "ta"]:
        res = client.post("/api/demo/run", json={
            "language": lang,
            "example_index": 0,
            "strategy": "baseline",
            "tau": 0.5,
            "model": "reference",
        })
        assert res.status_code == 200
        assert res.json()["final_answer"] is not None


# 8, 9, 10: Baseline, Strategy A, Strategy B
def test_case_08_09_10_strategies():
    for strat in ["baseline", "A", "B", "C", "D"]:
        res = client.post("/api/demo/run", json={
            "language": "hi",
            "example_index": 0,
            "strategy": strat,
            "tau": 0.5,
            "model": "reference",
        })
        assert res.status_code == 200
        assert res.json()["strategy"] == strat


# Live Gemma 3 4B Live Demo pipeline verification
def test_case_live_demo_gemma3_pipeline():
    with patch("backend.main.run_uncertainty_pipeline") as mock_pipe:
        mock_pipe.return_value = {
            "status": "delivered",
            "final_answer": "Bengaluru",
            "confidence": {"raw_verbalized": 0.99, "statistical": None, "calibrated": 0.92, "delta_vs_raw": -0.07, "is_abstained": False},
            "trace": [{"label": "Model", "text": "gemma3:4b"}],
            "claims": ["Bengaluru is capital"],
            "evidence": "Evidence passage",
        }
        res = client.post("/api/demo/run", json={
            "language": "en",
            "example_index": 0,
            "strategy": "B",
            "tau": 0.5,
            "model": "gemma3:4b",
        })
        assert res.status_code == 200
        assert res.json()["final_answer"] == "Bengaluru"
        mock_pipe.assert_called_once()
        args, kwargs = mock_pipe.call_args
        assert kwargs["model"] == "gemma3:4b"
        assert kwargs["strategy"] == "B"


# 11 & 12: Adaptive sampling triggered vs not triggered
def test_case_11_adaptive_sampling_triggered():
    with patch.object(OllamaService, "chat") as mock_chat, \
         patch.object(OllamaService, "chat_multiple") as mock_mult:
        mock_chat.return_value = {"response": "The capital is Bangalore", "message": {"content": "The capital is Bangalore"}}
        # Initial 2 responses completely diverge
        mock_mult.side_effect = [
            [{"response": "The treaty was signed in Paris"}, {"response": "Quantum computers use qubits"}],  # High diversity -> triggers expansion
            [{"response": "Bangalore is the center"}, {"response": "Karnataka capital"}],  # Expansion call
        ]
        res = run_uncertainty_pipeline(
            model="qwen3:4b",
            language="en",
            question_text="Complex test question?",
            strategy="baseline",
            tau=0.5,
            num_generations=4,
            adaptive_sampling=True,
        )
        assert res["execution"]["adaptive_sampling_triggered"] is True


def test_case_12_adaptive_sampling_not_triggered():
    with patch.object(OllamaService, "chat") as mock_chat, \
         patch.object(OllamaService, "chat_multiple") as mock_mult:
        mock_chat.return_value = {"response": "Identical answer", "message": {"content": "Identical answer"}}
        # Initial responses agree 100%
        mock_mult.side_effect = [
            [{"response": "Identical answer"}, {"response": "Identical answer"}],
        ]
        res = run_uncertainty_pipeline(
            model="qwen3:4b",
            language="en",
            question_text="Simple question?",
            strategy="baseline",
            tau=0.5,
            num_generations=4,
            adaptive_sampling=True,
        )
        assert res["execution"]["adaptive_sampling_triggered"] is False


# 13: Multiple-response generation
def test_case_13_multi_response_generation():
    with patch.object(OllamaService, "chat") as mock_chat, \
         patch.object(OllamaService, "chat_multiple") as mock_mult:
        mock_chat.return_value = {"response": "Candidate 1", "message": {"content": "Candidate 1"}}
        mock_mult.return_value = [{"response": "Candidate 2"}, {"response": "Candidate 3"}]

        res = run_uncertainty_pipeline(
            model="qwen3:4b",
            language="en",
            question_text="What is 2+2?",
            strategy="baseline",
            tau=0.5,
            num_generations=3,
            adaptive_sampling=False,
        )
        assert res["execution"]["generations_count"] == 3


# 14: Feature extraction (semantic similarity, agreement, diversity, entropy)
def test_case_14_feature_extraction():
    candidates = ["Bangalore is the capital.", "The capital is Bengaluru.", "Karnataka's capital is Bangalore."]
    agree, div, ent = compute_semantic_entropy(candidates)
    assert 0.0 <= agree <= 1.0
    assert 0.0 <= div <= 1.0
    assert 0.0 <= ent <= 1.0
    assert round(agree + div, 2) == 1.0


# 15 & 16: Trained vs Untrained Classifier
def test_case_16_classifier_not_trained_display():
    with patch.object(OllamaService, "chat") as mock_chat, \
         patch.object(OllamaService, "chat_multiple") as mock_mult:
        mock_chat.return_value = {"response": "Sample answer", "message": {"content": "Sample answer"}}
        mock_mult.return_value = [{"response": "Sample answer"}]

        res = run_uncertainty_pipeline(
            model="qwen3:4b",
            language="en",
            question_text="Question?",
            strategy="baseline",
            tau=0.5,
        )
        assert res["execution"]["classifier_status"] == "CLASSIFIER NOT TRAINED"
        # Must be in trace for display in Output Panel
        trace_texts = [t["text"] for t in res["trace"]]
        assert any("CLASSIFIER NOT TRAINED" in t for t in trace_texts)


# 17: Calibration status
def test_case_17_calibration_status():
    with patch.object(OllamaService, "chat") as mock_chat, \
         patch.object(OllamaService, "chat_multiple") as mock_mult:
        mock_chat.return_value = {"response": "Sample answer", "message": {"content": "Sample answer"}}
        mock_mult.return_value = [{"response": "Sample answer"}]

        res = run_uncertainty_pipeline(
            model="qwen3:4b",
            language="hi",
            question_text="Question?",
            strategy="baseline",
            tau=0.5,
        )
        assert res["confidence"]["calibrated"] > 0
        trace_texts = [t["text"] for t in res["trace"]]
        assert any("Model 2 Language-Shift Platt" in t for t in trace_texts)


# 18: Backend failure handling
def test_case_18_backend_failure_handling():
    res = client.post("/api/demo/run", json={
        "language": "invalid_lang",
        "strategy": "baseline",
        "tau": 0.5,
    })
    assert res.status_code == 422


# 19: Model not found failure handling
def test_case_19_model_not_found():
    with patch.object(OllamaService, "check_connection") as mock_conn, \
         patch.object(OllamaService, "list_installed_models") as mock_models:
        mock_conn.return_value = {"connected": True}
        mock_models.return_value = ["qwen2.5:3b"]

        res = client.post("/api/demo/run", json={
            "language": "en",
            "strategy": "baseline",
            "tau": 0.5,
            "model": "non_existent_model_xyz:99b",
        })
        assert res.status_code == 404
        assert "not installed locally" in res.json()["detail"]


# 20: Repeated submissions idempotency
def test_case_20_repeated_submissions():
    for _ in range(3):
        res = client.post("/api/demo/run", json={
            "language": "en",
            "example_index": 0,
            "strategy": "B",
            "tau": 0.7,
        })
        assert res.status_code == 200
        assert res.json()["status"] == "delivered"


# 21: Direct Chat Status detects gemma3:4b
def test_case_21_chat_status():
    res = client.get("/api/chat/status")
    assert res.status_code == 200
    data = res.json()
    assert data["target_model"] == "gemma3:4b"
    assert "is_available" in data


# 22: Direct Chat Non-streaming
def test_case_22_chat_non_streaming():
    with patch.object(OllamaService, "chat") as mock_chat:
        mock_chat.return_value = {
            "model": "gemma3:4b",
            "message": {"role": "assistant", "content": "Uncertainty in LLMs represents epistemic risk."},
        }
        res = client.post("/api/chat", json={
            "model": "gemma3:4b",
            "messages": [{"role": "user", "content": "Explain uncertainty."}],
            "stream": False,
        })
        assert res.status_code == 200
        assert "Uncertainty" in res.json()["message"]["content"]


# 23: Direct Chat Streaming
def test_case_23_chat_streaming():
    with patch.object(OllamaService, "chat_stream") as mock_stream:
        mock_stream.return_value = iter([
            'data: {"model":"gemma3:4b","message":{"content":"Hello"}}\n\n',
            'data: {"model":"gemma3:4b","message":{"content":" world"}}\n\n',
        ])
        res = client.post("/api/chat", json={
            "model": "gemma3:4b",
            "messages": [{"role": "user", "content": "Hi"}],
            "stream": True,
        })
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]

