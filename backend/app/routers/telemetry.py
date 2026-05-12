from fastapi import APIRouter, Query

from app.models import (
    EnvironmentState,
    HistoryResponse,
    TelemetryReading,
    TelemetryUploadResponse,
)
from app.services.telemetry_service import (
    get_current_telemetry,
    get_environment_state,
    get_history,
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
    # Placeholder for future real sensor integration:
    # - HTTP devices can post telemetry directly to this endpoint.
    # - MQTT devices can be consumed by a bridge that calls the same service.
    receive_uploaded_telemetry(payload)
    return TelemetryUploadResponse(
        success=True,
        message="Telemetry received. Real sensor integration placeholder.",
    )


@router.get("/state", response_model=EnvironmentState)
def telemetry_state() -> EnvironmentState:
    return get_environment_state()

