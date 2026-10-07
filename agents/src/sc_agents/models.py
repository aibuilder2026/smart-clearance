"""The models, and the writers that call them (SC-72).

**Live** (MODEL_TIER=live): Gemini on Vertex AI through ADK. ADK's `Gemini` model builds a google-genai Client per
event loop from its `client_kwargs`; we pass `enterprise=True` (Vertex AI), the project, GENAI_LOCATION (default
`global`, where the Gemini 3 models are served) and the service's own credentials (gcp.py: sc-agents-local
impersonated on a laptop, sc-agents on Cloud Run). No API key exists. MODEL_PRO and MODEL_FLASH name the models.

**Stub** (MODEL_TIER=stub): each writer's `before_model_callback` answers from recordings/ (or a test's own), so no
model is ever reached: the stub tier's model raises if it is.

**A writer** is an `LlmAgent` with a structured output (`output_schema`, saved under `output_key`) inside `Bounded`,
which holds it to the run's rules:
- a 20 s timeout (MODEL_TIMEOUT_S), on the HTTP request and around the whole call;
- any error, timeout, or output that does not validate leaves the output empty, so the agent omits that field and
  backend-api's template stands in; the run says it fell back;
- at most 12 model calls a run (MODEL_CALLS_PER_RUN); past that, the writer falls back without calling;
- temperature 0.2 for structured output, 0.7 for offer copy; thinking kept low, for the timeout;
- the prompt is a plain text file in prompts/; the facts go in as the user's turn, untrusted text quoted as data.
"""

import asyncio
import hashlib
import json
import logging
import re
import time
from collections.abc import AsyncGenerator, Callable
from functools import cache
from pathlib import Path
from typing import Any, Literal

from google.adk.agents import BaseAgent, LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.models import BaseLlm, Gemini, LlmRequest, LlmResponse
from google.genai import types
from pydantic import BaseModel, ValidationError

from sc_agents.runs import RunCtx
from sc_agents.settings import Settings

log = logging.getLogger("sc_agents.models")

PROMPTS = Path(__file__).parent / "prompts"
RECORDINGS = Path(__file__).parent / "recordings"
Tier = Literal["pro", "flash"]
STRUCTURED, COPY = 0.2, 0.7


@cache
def prompt(name: str) -> str:
    return (PROMPTS / f"{name}.txt").read_text(encoding="utf-8").strip()


def prompt_version(name: str) -> str:
    """a prompt's version: its content's hash, as the evals record it"""
    return hashlib.sha256(prompt(name).encode()).hexdigest()[:12]


class Unreachable(BaseLlm):
    """the stub tier's model: the recordings answer before it is reached, and reaching it is a bug"""

    model: str = "stub"

    async def generate_content_async(self, llm_request: LlmRequest, stream: bool = False):  # type: ignore[override]
        raise RuntimeError("MODEL_TIER=stub: no recording answered this model call")
        yield  # pragma: no cover


class Recordings:
    """recorded model responses, by writer: a response, a list of them (answered in turn), or {"by": {selector:
    response}, "default": response}. A response is {"json": …} or {"text": "…"}, with an optional "delay" (seconds),
    "error" (raised) and "usage" ([tokens in, tokens out])"""

    def __init__(self, data: dict[str, Any] | None = None):
        self.data = dict(data or {})

    @classmethod
    def load(cls, folder: Path = RECORDINGS) -> "Recordings":
        data: dict[str, Any] = {}
        for f in sorted(folder.glob("*.json")):
            data[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        return cls(data)

    def answer(self, writer: str, selector: str = "") -> dict[str, Any] | None:
        spec = self.data.get(writer)
        if isinstance(spec, list):
            return spec.pop(0) if spec else None
        if isinstance(spec, dict) and "by" in spec:
            return spec["by"].get(selector, spec.get("default"))
        return spec


class ModelTier:
    def __init__(self, settings: Settings, recordings: Recordings | None = None):
        self.settings = settings
        self.stub = settings.model_tier == "stub"
        self.recordings = recordings if recordings is not None else Recordings.load() if self.stub else Recordings()
        self._llms: dict[str, BaseLlm] = {}

    def llm(self, tier: Tier) -> BaseLlm:
        if tier not in self._llms:
            if self.stub:
                self._llms[tier] = Unreachable(model=f"stub-{tier}")
            else:
                from sc_agents.gcp import credentials

                self._llms[tier] = Gemini(
                    model=self.settings.model_id(tier),
                    client_kwargs={
                        "enterprise": True,
                        "project": self.settings.google_cloud_project,
                        "location": self.settings.genai_location,
                        "credentials": credentials(),
                    },
                )
        return self._llms[tier]

    def model_id(self, tier: Tier) -> str:
        return self.settings.model_id(tier)

    async def check(self) -> dict[str, str]:
        """readiness: each model id resolves on Vertex AI (a metadata read, no generation); {} when all do"""
        if self.stub:
            return {}
        problems: dict[str, str] = {}
        for tier in ("pro", "flash"):
            try:
                name = self.settings.model_id(tier)  # type: ignore[arg-type]
                llm = self.llm(tier)  # type: ignore[arg-type]
                assert isinstance(llm, Gemini)
                await asyncio.wait_for(llm.api_client.aio.models.get(model=name), timeout=10)
            except Exception as e:
                problems[tier] = f"{type(e).__name__}: {e}"[:300]
        return problems


# --- the writer ------------------------------------------------------------------------------------------------------


def halted(state: dict[str, Any], scope: str = "") -> bool:
    return bool(state.get("halt") or (scope and state.get(f"halt:{scope}")))


def _response(text: str, usage: tuple[int, int] = (0, 0)) -> LlmResponse:
    return LlmResponse(
        content=types.Content(role="model", parts=[types.Part(text=text)]),
        usage_metadata=types.GenerateContentResponseUsageMetadata(
            prompt_token_count=usage[0], candidates_token_count=usage[1]
        ),
    )


def _text(r: LlmResponse) -> str:
    if not r.content or not r.content.parts:
        return ""
    return "".join(p.text for p in r.content.parts if p.text and not p.thought)


def validate(schema: type[BaseModel], text: str) -> dict[str, Any] | None:
    """a model's text as its schema's dict, or None when it is not that"""
    s = text.strip()
    fence = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", s, flags=re.S)
    if fence:
        s = fence.group(1)
    try:
        return schema.model_validate_json(s).model_dump(exclude_none=True)
    except (ValidationError, ValueError):
        return None


def _describe(parts: list[types.Part]) -> list[str]:
    out = []
    for p in parts:
        if p.text is not None:
            out.append(p.text)
        elif p.inline_data is not None:
            out.append(f"<{p.inline_data.mime_type}, {len(p.inline_data.data or b'')} bytes>")
        elif p.file_data is not None:
            out.append(f"<{p.file_data.mime_type} {p.file_data.file_uri}>")
    return out


class Bounded(BaseAgent):
    """a writer: its LlmAgent run inside the timeout, with an empty output when it fails (the template stands in)"""

    rc: Any
    agent: str
    step: str
    output_key: str
    timeout: float
    scope: str = ""
    when: Any = None

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event]:
        state = dict(ctx.session.state)
        if halted(state, self.scope) or (self.when is not None and not self.when(state)):
            return
        run = self.rc.run(self.agent, self.step)
        events: list[Event] = []
        try:
            async with asyncio.timeout(self.timeout):
                async for ev in self.sub_agents[0].run_async(ctx):
                    events.append(ev)
        except TimeoutError:
            run.fell_back("timeout")
            log.warning("%s: the model call timed out after %ss", self.name, self.timeout)
        except Exception as e:  # any model failure: the template stands in
            run.fell_back(f"{type(e).__name__}")
            log.warning("%s: the model call failed: %s", self.name, e)
        saved = False
        for ev in events:
            saved = saved or self.output_key in (ev.actions.state_delta or {})
            yield ev
        if not saved:
            yield Event(
                author=self.name,
                invocation_id=ctx.invocation_id,
                actions=EventActions(state_delta={self.output_key: {}}),
            )


def writer(
    rc: RunCtx,
    *,
    name: str,
    agent: str,
    tier: Tier,
    prompt_name: str,
    schema: type[BaseModel],
    output_key: str,
    parts: Callable[[dict[str, Any]], list[types.Part]],
    temperature: float = STRUCTURED,
    step: str | None = None,
    selector: Callable[[dict[str, Any]], str] | None = None,
    when: Callable[[dict[str, Any]], bool] | None = None,
    scope: str = "",
    max_tokens: int | None = None,
) -> Bounded:
    """a model call in a pipeline: `parts(state)` is the user's turn, the prompt file the system instruction"""
    step = step or agent
    models: ModelTier = rc.deps.models
    settings = rc.settings
    timeout = settings.model_timeout_s
    starts: dict[str, float] = {}

    async def before(cc: CallbackContext, req: LlmRequest) -> LlmResponse | None:
        run = rc.run(agent, step)
        rc.model_calls += 1
        if rc.model_calls > settings.model_calls_per_run:
            run.fell_back("model call limit")
            log.warning("%s: over %s model calls in this run; the template stands in", name, rc.model_calls - 1)
            return _response("{}")
        state = cc.state.to_dict()
        content = parts(state)
        req.contents = [types.Content(role="user", parts=content)]
        run.model, run.calls = models.model_id(tier), run.calls + 1
        system = req.config.system_instruction if req.config else None
        rc.requests.append({"writer": name, "system": str(system or ""), "parts": _describe(content)})
        rc.trajectory.append(f"model {name}")
        starts[name] = time.monotonic()
        if not models.stub:
            return None
        spec = models.recordings.answer(name, selector(state) if selector else "")
        if spec is None:
            raise RuntimeError(f"no recording for {name}")
        if spec.get("delay"):
            await asyncio.sleep(float(spec["delay"]))
        if spec.get("error"):
            raise RuntimeError(str(spec["error"]))
        text = spec["text"] if "text" in spec else json.dumps(spec.get("json", {}), ensure_ascii=False)
        usage = spec.get("usage") or (0, 0)
        return _checked(_response(text, (int(usage[0]), int(usage[1]))))

    def _checked(resp: LlmResponse) -> LlmResponse:
        run = rc.run(agent, step)
        run.latency_ms += int((time.monotonic() - starts.pop(name, time.monotonic())) * 1000)
        if resp.usage_metadata is not None:
            run.tokens_in += int(resp.usage_metadata.prompt_token_count or 0)
            run.tokens_out += int(resp.usage_metadata.candidates_token_count or 0)
        if validate(schema, _text(resp)) is None:
            run.fell_back("output did not validate")
            log.warning("%s: the model's output did not match its schema", name)
            return _response("{}")
        return resp

    def after(cc: CallbackContext, resp: LlmResponse) -> LlmResponse | None:
        if resp.partial:
            return None
        checked = _checked(resp)
        return None if checked is resp else checked

    def on_error(cc: CallbackContext, req: LlmRequest, error: Exception) -> LlmResponse | None:
        run = rc.run(agent, step)
        run.latency_ms += int((time.monotonic() - starts.pop(name, time.monotonic())) * 1000)
        run.fell_back(type(error).__name__)
        log.warning("%s: the model call failed: %s", name, error)
        return _response("{}")

    system_text = prompt(prompt_name)
    config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
        http_options=types.HttpOptions(timeout=int(timeout * 1000)),
        thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW),
    )
    llm = LlmAgent(
        name=f"{name}_model",
        description=f"{agent}: {prompt_name}",
        model=models.llm(tier),
        # a callable instruction is used as it is: ADK fills {placeholders} in a plain string from the state
        instruction=lambda _ctx: system_text,
        output_schema=schema,
        output_key=output_key,
        include_contents="none",
        generate_content_config=config,
        disallow_transfer_to_parent=True,
        disallow_transfer_to_peers=True,
        before_model_callback=before,
        after_model_callback=after,
        on_model_error_callback=on_error,
    )
    return Bounded(
        name=name,
        sub_agents=[llm],
        rc=rc,
        agent=agent,
        step=step,
        output_key=output_key,
        timeout=timeout,
        scope=scope,
        when=when,
    )
