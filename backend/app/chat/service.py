import json
from collections.abc import AsyncIterator
from typing import Any

from pydantic import SecretStr

from app.briefing.provider import ProviderSupport, as_dict, as_list
from app.briefing.service import BriefingService
from app.chat.schemas import ChatRequest
from app.chat.tools import TOOLS, ToolExecutor
from app.core.config import ChatSettings
from app.core.errors import ApiError
from app.weather.service import WeatherService

_SYSTEM_INSTRUCTION = (
    "You are the assistant embedded in Morning Pulse, a personal morning briefing "
    "dashboard covering weather, crypto, stocks, currencies, news, and events. "
    "Use the available tools to fetch real, current data before answering questions "
    "about any of those topics - never guess or make up numbers. Be concise and helpful."
)

# One hop covers the common case (one round of tool calls, then the final
# answer); a second is allowed for questions that need two different tools.
_MAX_TOOL_HOPS = 2


class ChatService:
    def __init__(
        self,
        provider: ProviderSupport,
        settings: ChatSettings,
        briefing: BriefingService,
        weather: WeatherService,
    ) -> None:
        self._provider = provider
        self._settings = settings
        self._briefing = briefing
        self._weather = weather

    async def stream_reply(self, request: ChatRequest) -> AsyncIterator[str]:
        """Validate synchronously, then return an unstarted generator to stream.

        Keeping validation outside the generator body means an invalid request
        raises ApiError before any StreamingResponse (and its 200 status) is
        committed to the client.
        """
        api_key = self._validate(request)
        contents = [
            {
                "role": "model" if message.role == "assistant" else "user",
                "parts": [{"text": message.content}],
            }
            for message in request.messages
        ]
        tools = ToolExecutor(self._briefing, self._weather, request.location)
        return self._stream(contents, api_key, tools)

    def _validate(self, request: ChatRequest) -> SecretStr:
        api_key = self._settings.gemini_api_key
        if api_key is None:
            raise ApiError(424, "chat_not_configured", "Connect a Gemini API key to enable chat")
        if not request.messages:
            raise ApiError(422, "empty_conversation", "Send at least one message")
        if len(request.messages) > self._settings.max_messages:
            raise ApiError(422, "conversation_too_long", "Conversation is too long")
        for message in request.messages:
            if len(message.content) > self._settings.max_message_chars:
                raise ApiError(422, "message_too_long", "A message is too long")
        return api_key

    async def _stream(
        self,
        contents: list[dict[str, Any]],
        api_key: SecretStr,
        tools: ToolExecutor,
    ) -> AsyncIterator[str]:
        hops = 0
        while True:
            pending_calls: list[list[dict[str, Any]]] = []
            async for parts in self._stream_once(contents, api_key):
                if any("functionCall" in part for part in parts):
                    pending_calls.append(parts)
                else:
                    for part in parts:
                        text = part.get("text")
                        if text:
                            yield text

            if not pending_calls or hops >= _MAX_TOOL_HOPS:
                return

            hops += 1
            for parts in pending_calls:
                contents.append({"role": "model", "parts": parts})
                for part in parts:
                    call = part.get("functionCall")
                    if not call:
                        continue
                    result = await tools.call(call["name"], call.get("args") or {})
                    contents.append(
                        {
                            "role": "user",
                            "parts": [
                                {
                                    "functionResponse": {
                                        "name": call["name"],
                                        "id": call.get("id"),
                                        "response": result,
                                    }
                                }
                            ],
                        }
                    )

    async def _stream_once(
        self, contents: list[dict[str, Any]], api_key: SecretStr
    ) -> AsyncIterator[list[dict[str, Any]]]:
        model = self._settings.gemini_model
        url = f"{self._settings.gemini_url}/models/{model}:streamGenerateContent"
        headers = {
            "x-goog-api-key": api_key.get_secret_value(),
            "Content-Type": "application/json",
        }
        body = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": _SYSTEM_INSTRUCTION}]},
            "tools": TOOLS,
            "generationConfig": {"thinkingConfig": {"thinkingLevel": "minimal"}},
        }
        async with self._provider.http.stream(
            "POST", url, params={"alt": "sse"}, json=body, headers=headers
        ) as response:
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                try:
                    payload = json.loads(line[len("data: ") :])
                except ValueError:
                    continue
                parts = _extract_parts(payload)
                if parts:
                    yield parts


def _extract_parts(payload: object) -> list[dict[str, Any]]:
    candidates = as_list(as_dict(payload).get("candidates"))
    if not candidates:
        return []
    content = as_dict(as_dict(candidates[0]).get("content"))
    return [as_dict(part) for part in as_list(content.get("parts"))]
