from app.models import (
    EnvironmentState,
    HistoryPoint,
    HistoryResponse,
    TelemetryReading,
)
from app.sensor_provider import SensorReading, sensor_provider


def reading_to_model(reading: SensorReading) -> TelemetryReading:
    return TelemetryReading(**reading.to_dict())


def model_to_reading(payload: TelemetryReading) -> SensorReading:
    return SensorReading(**payload.model_dump())


def get_current_telemetry() -> TelemetryReading:
    return reading_to_model(sensor_provider.get_current_reading())


def get_history(range_value: str = "1h") -> HistoryResponse:
    readings = sensor_provider.get_history(range_value)
    points = [
        HistoryPoint(
            timestamp=reading.timestamp,
            temperature=reading.temperature,
            humidity=reading.humidity,
            air_quality=reading.air_quality,
            co2=reading.co2,
            light=reading.light,
        )
        for reading in readings
    ]
    room_id = readings[-1].room_id if readings else "Dorm-A101"
    return HistoryResponse(room_id=room_id, range=range_value, data=points)


def receive_uploaded_telemetry(payload: TelemetryReading) -> None:
    # Future real sensors can report here through HTTP. An MQTT bridge can also
    # subscribe to device topics and call this service after decoding payloads.
    sensor_provider.ingest_reading(model_to_reading(payload))


def get_environment_state() -> EnvironmentState:
    reading = sensor_provider.get_current_reading()
    return calculate_environment_state(reading)


def calculate_environment_state(reading: SensorReading) -> EnvironmentState:
    temperature_state = _temperature_state(reading.temperature)
    humidity_state = _humidity_state(reading.humidity)
    air_state = _air_state(reading.co2, reading.air_quality)
    light_state = _light_state(reading.light)
    occupancy_state = "occupied" if reading.motion else "vacant"
    comfort_score = _comfort_score(reading)
    comfort_level = _comfort_level(comfort_score)
    summary = _summary(
        temperature_state,
        humidity_state,
        air_state,
        light_state,
        occupancy_state,
    )

    return EnvironmentState(
        room_id=reading.room_id,
        comfort_level=comfort_level,
        comfort_score=comfort_score,
        temperature_state=temperature_state,
        humidity_state=humidity_state,
        air_state=air_state,
        light_state=light_state,
        occupancy_state=occupancy_state,
        summary=summary,
    )


def _temperature_state(temperature: float) -> str:
    if temperature > 28:
        return "hot"
    if temperature < 18:
        return "cold"
    if temperature < 22:
        return "cool"
    return "normal"


def _humidity_state(humidity: float) -> str:
    if humidity > 70:
        return "humid"
    if humidity < 35:
        return "dry"
    return "normal"


def _air_state(co2: int, air_quality: int) -> str:
    if co2 > 1200 or air_quality > 92:
        return "poor"
    if co2 > 1000 or air_quality > 85:
        return "moderate"
    return "good"


def _light_state(light: int) -> str:
    if light < 120:
        return "dim"
    if light > 700:
        return "bright"
    return "normal"


def _comfort_score(reading: SensorReading) -> int:
    score = 100

    if reading.temperature > 28:
        score -= min(26, int((reading.temperature - 28) * 10) + 10)
    elif reading.temperature < 20:
        score -= min(22, int((20 - reading.temperature) * 6) + 6)

    if reading.humidity > 70:
        score -= min(18, int((reading.humidity - 70) * 2) + 8)
    elif reading.humidity < 35:
        score -= min(15, int((35 - reading.humidity) * 1.5))

    if reading.co2 > 1000:
        score -= min(20, int((reading.co2 - 1000) / 25) + 8)

    if reading.air_quality > 85:
        score -= min(16, int((reading.air_quality - 85) * 1.8) + 7)

    if reading.light < 120:
        score -= 6

    return max(0, min(100, score))


def _comfort_level(score: int) -> str:
    if score >= 85:
        return "comfortable"
    if score >= 70:
        return "acceptable"
    if score >= 55:
        return "slightly_uncomfortable"
    return "uncomfortable"


def _summary(
    temperature_state: str,
    humidity_state: str,
    air_state: str,
    light_state: str,
    occupancy_state: str,
) -> str:
    parts: list[str] = []

    if temperature_state == "hot":
        parts.append("温度偏高")
    elif temperature_state in {"cold", "cool"}:
        parts.append("温度偏低")
    else:
        parts.append("温度适中")

    if humidity_state == "humid":
        parts.append("湿度偏高")
    elif humidity_state == "dry":
        parts.append("空气偏干")
    else:
        parts.append("湿度正常")

    if air_state == "poor":
        parts.append("空气质量风险较高")
    elif air_state == "moderate":
        parts.append("空气质量处于中等水平")
    else:
        parts.append("空气质量良好")

    if light_state == "dim":
        parts.append("光照不足")
    elif light_state == "bright":
        parts.append("光照偏强")

    occupancy_text = "检测到有人在宿舍" if occupancy_state == "occupied" else "当前未检测到明显活动"
    return f"当前宿舍{parts[0]}，{parts[1]}，{parts[2]}，{occupancy_text}。"

