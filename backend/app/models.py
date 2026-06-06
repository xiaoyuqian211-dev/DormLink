from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HealthResponse(BaseModel):
    status: str
    project: str
    message: str


class TelemetryReading(BaseModel):
    room_id: str = Field(examples=["Dorm-A101"])
    device_id: str = Field(examples=["DL-DEVICE-001"])
    timestamp: datetime = Field(default_factory=utc_now)
    temperature: float
    humidity: float
    light: int
    air_quality: int
    co2: int
    tvoc: float
    motion: bool
    noise: int
    signal_strength: int
    persons: int = 0


class HistoryPoint(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: float
    air_quality: int
    co2: int
    light: int


class HistoryResponse(BaseModel):
    room_id: str
    range: str
    data: list[HistoryPoint]


class TelemetryUploadResponse(BaseModel):
    success: bool
    message: str


class TelemetrySourceResponse(BaseModel):
    mode: str
    topic: str
    has_real_data: bool
    last_seen: datetime | None = None
    fallback: bool


class EnvironmentState(BaseModel):
    room_id: str
    comfort_level: Literal[
        "comfortable", "acceptable", "slightly_uncomfortable", "uncomfortable"
    ]
    comfort_score: int
    temperature_state: Literal["cold", "cool", "normal", "hot"]
    humidity_state: Literal["dry", "normal", "humid"]
    air_state: Literal["good", "moderate", "poor"]
    light_state: Literal["dim", "normal", "bright"]
    occupancy_state: Literal["occupied", "vacant"]
    summary: str


class PredictionResponse(BaseModel):
    room_id: str
    horizon: str
    temperature_trend: Literal["rising", "falling", "stable"]
    humidity_trend: Literal["rising", "falling", "stable"]
    air_quality_trend: Literal["improving", "worsening", "stable"]
    risk_level: Literal["low", "medium", "high"]
    risk_summary: str


class TwinZone(BaseModel):
    zone_id: str
    name: str
    state: str
    risk_level: Literal["low", "medium", "high"]


class TwinState(BaseModel):
    room_id: str
    room_status: Literal["occupied", "vacant"]
    comfort_score: int
    zones: list[TwinZone]
    future_hint: str
    recommended_actions: list[str] = Field(default_factory=list)


class FeedbackRequest(BaseModel):
    room_id: str
    feedback_type: str
    system_judgement: str
    user_response: str
    scene_label: str
    comment: str = ""


class FeedbackRecord(FeedbackRequest):
    timestamp: datetime = Field(default_factory=utc_now)


class FeedbackResponse(BaseModel):
    success: bool
    message: str


class ChatQuestion(BaseModel):
    question: str


class ChatAnswer(BaseModel):
    answer: str
