"""
Ollama Local LLM Service.

Handles connection detection, dynamic installed-model retrieval, and inference
against local Ollama instances (default: http://localhost:11434).
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("ollama_service")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
DEFAULT_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "60.0"))


class OllamaService:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, timeout: float = DEFAULT_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

    def check_connection(self) -> Dict[str, Any]:
        """Checks if the local Ollama daemon is reachable and retrieves installed models."""
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                    return {
                        "connected": True,
                        "base_url": self.base_url,
                        "models": models,
                        "raw_models": data.get("models", []),
                    }
                return {
                    "connected": False,
                    "base_url": self.base_url,
                    "error": f"Ollama returned status {res.status_code}",
                    "models": [],
                }
        except Exception as e:
            return {
                "connected": False,
                "base_url": self.base_url,
                "error": str(e),
                "models": [],
            }

    def list_installed_models(self) -> List[str]:
        """Returns the list of locally installed Ollama models suitable for text generation."""
        status = self.check_connection()
        if not status["connected"]:
            return []
        
        # Filter out embedding-only models if any, but keep generation models
        usable = []
        for m in status.get("raw_models", []):
            name = m.get("name", "")
            caps = m.get("details", {}).get("families", [])
            # Skip if explicitly only an embedding model (like all-minilm)
            details = m.get("details", {})
            if "bert" in details.get("family", "").lower() or name.startswith("all-minilm"):
                continue
            usable.append(name)
        
        return usable if usable else status.get("models", [])

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemma3:4b",
        temperature: float = 0.7,
        top_p: float = 0.9,
        max_tokens: int = 128,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Unified Gemma 3 4B Chat inference service."""
        options: Dict[str, Any] = {
            "temperature": float(temperature),
            "top_p": float(top_p),
            "num_predict": int(max_tokens),
        }
        if seed is not None:
            options["seed"] = int(seed)

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": options,
        }
        with httpx.Client(timeout=self.timeout) as client:
            res = client.post(f"{self.base_url}/api/chat", json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Ollama chat failed (HTTP {res.status_code}): {res.text}")
            data = res.json()
            content = data.get("message", {}).get("content", "").strip()
            data["response"] = content
            data["total_duration_sec"] = data.get("total_duration", 0) / 1e9
            data["eval_count"] = data.get("eval_count", 0)
            return data

    def chat_multiple(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemma3:4b",
        count: int = 4,
        temperature: float = 0.7,
        top_p: float = 0.9,
        max_tokens: int = 128,
    ) -> List[Dict[str, Any]]:
        """Generates `count` candidate responses using the unified Chat inference service."""
        responses = []
        for i in range(count):
            res = self.chat(
                messages=messages,
                model=model,
                temperature=temperature if count > 1 else 0.0,
                top_p=top_p,
                max_tokens=max_tokens,
                seed=42 + i if count > 1 else 42,
            )
            responses.append(res)
        return responses

    def generate(
        self,
        prompt: str,
        model: str,
        system: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9,
        max_tokens: int = 128,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Routes prompt generation directly through the unified Chat inference service."""
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            seed=seed,
        )

    def generate_multiple(
        self,
        prompt: str,
        model: str,
        count: int,
        system: Optional[str] = None,
        temperature: float = 0.7,
        top_p: float = 0.9,
        max_tokens: int = 128,
    ) -> List[Dict[str, Any]]:
        """Routes multi-candidate generation directly through the unified Chat inference service."""
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self.chat_multiple(
            messages=messages,
            model=model,
            count=count,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )

    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemma3:4b",
        temperature: float = 0.7,
    ):
        """Streams chat response chunks from Ollama."""
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": float(temperature)},
        }
        with httpx.Client(timeout=self.timeout) as client:
            with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                if response.status_code != 200:
                    err = response.read().decode("utf-8")
                    yield f"data: {{\"error\": {json.dumps(err)}}}\n\n"
                    return
                for line in response.iter_lines():
                    if line:
                        yield f"data: {line}\n\n"



ollama = OllamaService()

