from fastapi import APIRouter, Query

from app.models import (
    EnvironmentState,
    HistoryResponse,
    TelemetryLatestResponse,
    TelemetryReading,
    TelemetrySourceResponse,
    TelemetrySummaryResponse,
    TelemetryUploadResponse,
)
from app.services.telemetry_service import (
    get_current_telemetry,
    get_environment_state,
    get_history,
    get_latest_response,
    get_telemetry_summary,
    get_telemetry_source,
    receive_uploaded_telemetry,
)

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])
compat_router = APIRouter(prefix="/api", tags=["telemetry"])


@router.get("/current", response_model=TelemetryReading)
@router.get("/latest", response_model=TelemetryReading)
def current_telemetry() -> TelemetryReading:
    return get_current_telemetry()


@router.get("/history", response_model=HistoryResponse)
def telemetry_history(
    range_value: str = Query(default="1h", alias="range"),
    room_id: str | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
) -> HistoryResponse:
    return get_history(range_value=range_value, room_id=room_id, start=start, end=end)


@router.get("/summary", response_model=TelemetrySummaryResponse)
def telemetry_summary(
    room_id: str | None = Query(default=None),
    window: str = Query(default="1h"),
) -> TelemetrySummaryResponse:
    return get_telemetry_summary(room_id=room_id, window=window)


@router.post("/upload", response_model=TelemetryUploadResponse)
def upload_telemetry(payload: TelemetryReading) -> TelemetryUploadResponse:
    receive_uploaded_telemetry(payload)
    return TelemetryUploadResponse(
        success=True,
        message="Telemetry received and stored.",
    )


@router.get("/state", response_model=EnvironmentState)
def telemetry_state() -> EnvironmentState:
    return get_environment_state()


@router.get("/source", response_model=TelemetrySourceResponse)
def telemetry_source() -> TelemetrySourceResponse:
    return get_telemetry_source()


@compat_router.get("/realtime", response_model=TelemetryReading)
def current_telemetry_alias() -> TelemetryReading:
    return get_current_telemetry()


@compat_router.get("/telemetry/latest", response_model=TelemetryLatestResponse)
def latest_telemetry_alias(
    room_id: str | None = Query(default=None),
) -> TelemetryLatestResponse:
    return get_latest_response(room_id=room_id)


@compat_router.get("/history", response_model=HistoryResponse)
@compat_router.get("/telemetry/history", response_model=HistoryResponse)
def telemetry_history_alias(
    range_value: str = Query(default="1h", alias="range"),
    room_id: str | None = Query(default=None),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
) -> HistoryResponse:
    return get_history(range_value=range_value, room_id=room_id, start=start, end=end)


@compat_router.get("/telemetry/summary", response_model=TelemetrySummaryResponse)
def telemetry_summary_alias(
    room_id: str | None = Query(default=None),
    window: str = Query(default="1h"),
) -> TelemetrySummaryResponse:
    return get_telemetry_summary(room_id=room_id, window=window)


@compat_router.get("/telemetry/source", response_model=TelemetrySourceResponse)
def telemetry_source_alias() -> TelemetrySourceResponse:
    return get_telemetry_source()
