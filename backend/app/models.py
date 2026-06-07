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
    room_id: str
    device_id: str
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


class HistoryResponse(BaseModel):
    room_id: str
    range: str
    data: list[HistoryPoint]
    data_status: str = "real"
    sample_count: int = 0


class TelemetryLatestResponse(BaseModel):
    source: str
    data_status: str
    data: TelemetryReading | None


class MetricStat(BaseModel):
    avg: float | None = None
    min: float | None = None
    max: float | None = None
    delta: float | None = None


class TelemetrySummaryResponse(BaseModel):
    room_id: str
    window: str
    latest: TelemetryReading | None = None
    stats: dict[str, MetricStat]
    sample_count: int
    data_status: str


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
    room_id: str = "Dorm-A101"
    window: str = "1h"


class ChatAnswer(BaseModel):
    answer: str
    data_status: str = "mock"
    confidence: float = 0.5
    context: dict | None = None


class AssistantContextResponse(BaseModel):
    room_id: str
    window: str
    data_status: str
    latest: TelemetryReading | None = None
    recent_summary: dict
    recent_events: list[dict]
    thresholds: dict
    confidence: float


class AssistantAskRequest(BaseModel):
    room_id: str = "Dorm-A101"
    question: str
    window: str = "1h"


class AssistantAskResponse(BaseModel):
    answer: str
    data_status: str
    confidence: float
    context: AssistantContextResponse
