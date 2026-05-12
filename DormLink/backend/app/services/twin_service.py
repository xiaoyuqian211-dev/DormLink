from app.mock_data import ZONE_DEFINITIONS
from app.models import TwinState, TwinZone
from app.services.telemetry_service import calculate_environment_state
from app.sensor_provider import sensor_provider


def get_twin_state() -> TwinState:
    reading = sensor_provider.get_current_reading()
    environment = calculate_environment_state(reading)
    zones = _build_zones(environment)
    future_hint = _future_hint(environment)
    recommended_actions = _recommended_actions(environment)

    return TwinState(
        room_id=reading.room_id,
        room_status="occupied" if reading.motion else "vacant",
        comfort_score=environment.comfort_score,
        zones=zones,
        future_hint=future_hint,
        recommended_actions=recommended_actions,
    )


def _build_zones(environment) -> list[TwinZone]:
    zones: list[TwinZone] = []
    for zone in ZONE_DEFINITIONS:
        zone_id = zone["zone_id"]
        state = "normal"
        risk_level = "low"

        if zone_id == "window" and environment.air_state in {"moderate", "poor"}:
            state = "needs_ventilation"
            risk_level = "high" if environment.air_state == "poor" else "medium"
        elif zone_id == "desk" and environment.light_state == "dim":
            state = "low_light"
            risk_level = "medium"
        elif zone_id == "bed" and environment.temperature_state == "hot":
            state = "slightly_hot"
            risk_level = "medium"
        elif zone_id == "door" and environment.occupancy_state == "occupied":
            state = "activity_detected"
            risk_level = "low"

        zones.append(
            TwinZone(
                zone_id=zone_id,
                name=zone["name"],
                state=state,
                risk_level=risk_level,
            )
        )
    return zones


def _future_hint(environment) -> str:
    if environment.air_state in {"moderate", "poor"}:
        return "如果保持关闭门窗，空气质量可能继续下降。"
    if environment.humidity_state == "humid":
        return "湿度仍偏高，长时间停留可能会感到闷热。"
    if environment.temperature_state == "hot":
        return "温度处于偏高区间，建议关注午后热积累。"
    return "当前状态较稳定，继续观察即可。"


def _recommended_actions(environment) -> list[str]:
    actions: list[str] = []
    if environment.air_state in {"moderate", "poor"}:
        actions.append("短时间开窗通风")
    if environment.temperature_state == "hot":
        actions.append("开启风扇或降低空调设定温度")
    if environment.humidity_state == "humid":
        actions.append("开启除湿或增加空气流通")
    if environment.light_state == "dim":
        actions.append("打开学习区照明")
    if not actions:
        actions.append("维持当前环境设置")
    return actions

