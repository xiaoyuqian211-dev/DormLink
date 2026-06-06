from fastapi import APIRouter, Query

from app.models import (
    EnvironmentState,
    HistoryResponse,
    TelemetryReading,
    TelemetrySourceResponse,
    TelemetryUploadResponse,
)
from app.services.telemetry_service import (
    get_current_telemetry,
    get_environment_state,
    get_history,
    get_telemetry_source,
    receive_uploaded_telemetry,
)

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])


@router.get("/current", response_model=TelemetryReading)
def current_telemetry() -> TelemetryReading:
    return get_current_telemetry()


@router.get("/history", response_model=HistoryResponse)
def telemetry_history(
    range_value: str = Query(default="1h", alias="range"),
) -> HistoryResponse:
    return get_history(range_value)


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
