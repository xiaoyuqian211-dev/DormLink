from statistics import mean

from app.models import PredictionResponse
from app.sensor_provider import SensorReading, sensor_provider


def get_short_term_prediction(horizon: str = "30min") -> PredictionResponse:
    history = sensor_provider.get_history("1h")
    temperature_trend = _numeric_trend(history, "temperature")
    humidity_trend = _numeric_trend(history, "humidity")
    air_quality_trend = _air_quality_trend(history)
    risk_level = _risk_level(history, air_quality_trend, humidity_trend)
    risk_summary = _risk_summary(horizon, air_quality_trend, humidity_trend, risk_level)
    room_id = history[-1].room_id if history else "Dorm-A101"

    return PredictionResponse(
        room_id=room_id,
        horizon=horizon,
        temperature_trend=temperature_trend,
        humidity_trend=humidity_trend,
        air_quality_trend=air_quality_trend,
        risk_level=risk_level,
        risk_summary=risk_summary,
    )


def _numeric_trend(history: list[SensorReading], field: str) -> str:
    if len(history) < 6:
        return "stable"
    early = mean(getattr(item, field) for item in history[:3])
    late = mean(getattr(item, field) for item in history[-3:])
    diff = late - early
    if diff > 1.2:
        return "rising"
    if diff < -1.2:
        return "falling"
    return "stable"


def _air_quality_trend(history: list[SensorReading]) -> str:
    if len(history) < 6:
        return "stable"
    early_aq = mean(item.air_quality for item in history[:3])
    late_aq = mean(item.air_quality for item in history[-3:])
    early_co2 = mean(item.co2 for item in history[:3])
    late_co2 = mean(item.co2 for item in history[-3:])

    if late_aq - early_aq > 3 or late_co2 - early_co2 > 80:
        return "worsening"
    if early_aq - late_aq > 3 or early_co2 - late_co2 > 80:
        return "improving"
    return "stable"


def _risk_level(
    history: list[SensorReading], air_quality_trend: str, humidity_trend: str
) -> str:
    if not history:
        return "low"
    latest = history[-1]
    if latest.co2 > 1200 or latest.air_quality > 92:
        return "high"
    if (
        latest.co2 > 1000
        or latest.air_quality > 85
        or air_quality_trend == "worsening"
        or humidity_trend == "rising"
    ):
        return "medium"
    return "low"


def _risk_summary(
    horizon: str, air_quality_trend: str, humidity_trend: str, risk_level: str
) -> str:
    if risk_level == "high":
        return f"未来 {horizon} 宿舍环境风险偏高，建议立即通风并关注 CO2 与空气质量变化。"
    if air_quality_trend == "worsening":
        return f"未来 {horizon} 空气质量可能继续下降，建议适当通风。"
    if humidity_trend == "rising":
        return f"未来 {horizon} 湿度可能继续上升，建议开启除湿或短时通风。"
    return f"未来 {horizon} 宿舍环境整体稳定，保持当前通风和照明即可。"

