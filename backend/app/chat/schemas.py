from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatLocation(BaseModel):
    latitude: float
    longitude: float
    name: str = "Your location"


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    location: ChatLocation | None = None
