"""Assistant context and answer generation based on persisted telemetry."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from typing import Any
from urllib import request

from app.ai_prompt import build_environment_explanation_prompt
from app.config import settings
from app.database import build_telemetry_summary, get_latest_telemetry, query_telemetry_history

logger = logging.getLogger("uvicorn.error")

THRESHOLDS = {
    "co2_warn": 1000,
    "co2_high": 1500,
    "noise_warn": 55,
    "temperature_comfort_min": 18,
    "temperature_comfort_max": 28,
    "humidity_comfort_min": 40,
    "humidity_comfort_max": 60,
    "light_low": 120,
}

KEY_FIELDS = ("temperature", "humidity", "co2", "noise", "light", "air_quality", "tvoc")


def get_assistant_context(room_id: str = "Dorm-A101", window: str = "1h") -> dict[str, Any]:
    latest = get_latest_telemetry(room_id)
    summary = build_telemetry_summary(room_id=room_id, window=window)
    history = query_telemetry_history(room_id=room_id, range_value=window)
    context = {
        "room_id": room_id,
        "window": window,
        "data_status": "real" if latest else "mock",
        "latest": latest.model_dump(mode="json") if latest else None,
        "recent_summary": summary,
        "recent_events": _recent_events(history),
        "thresholds": THRESHOLDS,
        "confidence": 0.5,
    }
    context["confidence"] = calculate_confidence(context)
    return context


def answer_assistant_question(
    *,
    room_id: str = "Dorm-A101",
    question: str,
    window: str = "1h",
) -> dict[str, Any]:
    context = get_assistant_context(room_id=room_id, window=window)
    prompt = build_environment_explanation_prompt(question, context)
    answer = _call_llm(prompt)
    if not answer:
        answer = _fallback_answer(question, context)

    return {
        "answer": answer,
        "data_status": context["data_status"],
        "confidence": context["confidence"],
        "context": context,
    }


def calculate_confidence(context: dict[str, Any]) -> float:
    latest = context.get("latest")
    if not latest or context.get("data_status") != "real":
        return 0.45

    confidence = 0.9 if _is_recent(latest.get("timestamp")) else 0.75
    sample_count = int((context.get("recent_summary") or {}).get("sample_count") or 0)
    if sample_count >= 12:
        confidence += 0.05

    missing = sum(1 for field in KEY_FIELDS if latest.get(field) is None)
    confidence -= missing * 0.05
    return round(max(0.4, min(0.98, confidence)), 2)


def _call_llm(messages: list[dict[str, str]]) -> str | None:
    if not settings.llm_api_key or not settings.llm_api_url:
        return None

    payload = json.dumps(
        {
            "model": settings.llm_model,
            "messages": messages,
            "temperature": 0.2,
        }
    ).encode("utf-8")
    req = request.Request(
        settings.llm_api_url,
        data=payload,
        headers={
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=12) as response:
            body = json.loads(response.read().decode("utf-8"))
        return (
            body.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        ) or None
    except Exception:
        logger.exception("LLM request failed, using assistant rule fallback")
        return None


def _fallback_answer(question: str, context: dict[str, Any]) -> str:
    latest = context.get("latest")
    summary = context.get("recent_summary") or {}
    stats = summary.get("stats") or {}
    events = context.get("recent_events") or []
    if not latest:
        return (
            "结论：当前数据不足，只能给出初步判断。\n"
            "原因：数据库中还没有可用的真实 telemetry 记录，无法引用当前 CO2、温湿度或噪声读数。\n"
            "建议：先确认 MQTT Bridge 已收到 dormlink/telemetry，并检查 /api/telemetry/latest 是否返回 real。"
        )

    co2 = latest.get("co2")
    noise = latest.get("noise")
    temperature = latest.get("temperature")
    humidity = latest.get("humidity")
    co2_stat = stats.get("co2") or {}
    noise_stat = stats.get("noise") or {}
    temp_stat = stats.get("temperature") or {}
    risk = _risk_level(latest)
    question_lower = question.lower()

    if "co2" in question_lower or "co₂" in question_lower or "二氧化碳" in question:
        conclusion = f"结论：当前 CO2 风险等级为{risk['co2']}。"
        reason = (
            f"原因：当前 CO2 为 {co2} ppm，最近 {summary.get('window', '1h')} "
            f"最高为 {_value(co2_stat.get('max'))} ppm，变化 {_value(co2_stat.get('delta'))} ppm。"
        )
        suggestion = _co2_suggestion(co2)
    elif "睡" in question or "休息" in question:
        conclusion = f"结论：当前睡眠环境{_sleep_status(co2, noise, temperature)}。"
        reason = (
            f"原因：当前温度 {temperature}°C、湿度 {humidity}%、噪声 {noise} dB、"
            f"CO2 {co2} ppm；最近噪声最高 {_value(noise_stat.get('max'))} dB。"
        )
        suggestion = "建议：睡前保持安静环境；若 CO2 超过 1000 ppm，先开窗 10 分钟再休息。"
    elif "变化" in question or "一小时" in question or "最近" in question:
        conclusion = "结论：近期变化主要看 CO2、温度和噪声。"
        reason = (
            f"原因：最近 {summary.get('window', '1h')} CO2 变化 {_value(co2_stat.get('delta'))} ppm，"
            f"温度变化 {_value(temp_stat.get('delta'))}°C，噪声变化 {_value(noise_stat.get('delta'))} dB。"
        )
        suggestion = "建议：如果 CO2 或噪声继续上升，优先通风并降低室内活动强度。"
    else:
        conclusion = f"结论：当前环境整体风险等级为{risk['overall']}。"
        reason = (
            f"原因：当前温度 {temperature}°C、湿度 {humidity}%、CO2 {co2} ppm、"
            f"噪声 {noise} dB；最近异常事件 {len(events)} 条。"
        )
        suggestion = _general_suggestion(latest)

    return f"{conclusion}\n{reason}\n{suggestion}"


def _recent_events(history: list[Any]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for reading in history[-120:]:
        timestamp = reading.timestamp.isoformat()
        if reading.co2 >= THRESHOLDS["co2_high"]:
            events.append(_event("co2_high", timestamp, reading.co2, "CO2 明显超过阈值，通风不足风险较高"))
        elif reading.co2 >= THRESHOLDS["co2_warn"]:
            events.append(_event("co2_warn", timestamp, reading.co2, "CO2 接近或超过阈值"))
        if reading.noise >= THRESHOLDS["noise_warn"]:
            events.append(_event("noise_high", timestamp, reading.noise, "噪声短时升高"))
        if reading.temperature > THRESHOLDS["temperature_comfort_max"]:
            events.append(_event("temperature_high", timestamp, reading.temperature, "温度高于舒适范围"))
        if not THRESHOLDS["humidity_comfort_min"] <= reading.humidity <= THRESHOLDS["humidity_comfort_max"]:
            events.append(_event("humidity_out_of_range", timestamp, reading.humidity, "湿度不在舒适范围"))
        if reading.light < THRESHOLDS["light_low"]:
            events.append(_event("light_low", timestamp, reading.light, "光照较低"))
    return events[-10:]


def _event(event_type: str, time: str, value: Any, message: str) -> dict[str, Any]:
    return {"type": event_type, "time": time, "value": value, "message": message}


def _risk_level(latest: dict[str, Any]) -> dict[str, str]:
    co2 = latest.get("co2") or 0
    noise = latest.get("noise") or 0
    temperature = latest.get("temperature") or 0
    humidity = latest.get("humidity") or 0
    co2_risk = "需要处理" if co2 >= 1500 else "轻度关注" if co2 >= 1000 else "正常"
    noise_risk = "轻度关注" if noise >= 55 else "正常"
    temp_risk = "轻度关注" if temperature > 28 or temperature < 18 else "正常"
    hum_risk = "轻度关注" if humidity < 40 or humidity > 60 else "正常"
    ordered = [co2_risk, noise_risk, temp_risk, hum_risk]
    overall = "需要处理" if "需要处理" in ordered else "轻度关注" if "轻度关注" in ordered else "正常"
    return {"overall": overall, "co2": co2_risk}


def _co2_suggestion(co2: float | int | None) -> str:
    if co2 is not None and co2 >= 1500:
        return "建议：立即开窗 15 分钟，并打开门形成对流；15 分钟后复查 CO2 是否降到 1000 ppm 以下。"
    if co2 is not None and co2 >= 1000:
        return "建议：优先开窗 10 分钟，必要时打开门形成短时对流，降低室内活动强度。"
    return "建议：当前 CO2 不高，保持常规通风即可。"


def _general_suggestion(latest: dict[str, Any]) -> str:
    if (latest.get("co2") or 0) >= 1000 or (latest.get("air_quality") or 0) >= 85:
        return "建议：优先开窗 10 分钟，并观察 CO2 与空气质量是否回落。"
    if (latest.get("noise") or 0) >= 55:
        return "建议：先确认噪声来源，降低持续干扰。"
    if (latest.get("temperature") or 0) > 28:
        return "建议：加强通风或调整风扇/空调，降低体感闷热。"
    return "建议：保持当前通风和传感器在线，继续观察近期趋势。"


def _sleep_status(co2: Any, noise: Any, temperature: Any) -> str:
    if (co2 or 0) >= 1000 or (noise or 0) >= 55 or (temperature or 0) > 29:
        return "需要轻度关注"
    return "较适合休息"


def _is_recent(timestamp: str | None) -> bool:
    if not timestamp:
        return False
    normalized = timestamp.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return False
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - parsed.astimezone(timezone.utc)).total_seconds() <= 120


def _value(value: Any) -> str:
    return "--" if value is None else str(value)
