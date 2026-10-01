import asyncio
import logging
from types import SimpleNamespace

import pytest

from app.ai.analyzer import run
from app.ai.gemini import Gemini
from app.errors import AIError
from app.schemas.analysis import QuizAnswers


class MalformedAI:
    def __init__(self):
        self.calls = 0

    async def generate(self, contents):
        self.calls += 1
        return "{}"


def test_malformed_model_response_is_rejected():
    ai = MalformedAI()

    with pytest.raises(AIError) as error:
        asyncio.run(
            run(ai, {"front": b"front", "mid": b"mid", "crown": b"crown"}, QuizAnswers(), 1)
        )

    assert error.value.status_code == 502
    assert error.value.reason == "malformed_response"
    assert ai.calls == 1
    assert "{}" not in str(error.value)


class SlowModels:
    async def generate_content(self, **kwargs):
        await asyncio.sleep(0.05)


def test_gemini_timeout_maps_to_safe_retryable_error():
    client = SimpleNamespace(aio=SimpleNamespace(models=SlowModels()))
    ai = Gemini(client, "test-model", timeout=0.001)

    with pytest.raises(AIError) as error:
        asyncio.run(ai.generate([]))

    assert error.value.status_code == 504
    assert error.value.reason == "timeout"
    assert error.value.retryable is True


def test_gemini_logs_usage_metadata_without_response_content(caplog):
    response = SimpleNamespace(
        text='{"result":"ok"}',
        model_version="test-model-version",
        usage_metadata=SimpleNamespace(
            prompt_token_count=1250,
            candidates_token_count=400,
            thoughts_token_count=50,
            total_token_count=1700,
        ),
    )

    class Models:
        config = None

        async def generate_content(self, **kwargs):
            self.config = kwargs["config"]
            return response

    models = Models()
    client = SimpleNamespace(aio=SimpleNamespace(models=models))
    ai = Gemini(client, "test-model", timeout=1)
    with caplog.at_level(logging.INFO, logger="app.ai"):
        result = asyncio.run(ai.generate([]))

    event = next(record for record in caplog.records if record.message == "ai_provider_call_ok")
    assert result == response.text
    assert event.ctx["prompt_tokens"] == 1250
    assert event.ctx["candidate_tokens"] == 400
    assert event.ctx["thought_tokens"] == 50
    assert event.ctx["total_tokens"] == 1700
    assert event.ctx["model_version"] == "test-model-version"
    assert response.text not in str(event.ctx)
    assert models.config.max_output_tokens == 4096
    assert models.config.thinking_config.thinking_budget == 2048