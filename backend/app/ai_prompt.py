"""Prompt builder for DormLink environment explanations."""

from __future__ import annotations

from typing import Any


def build_environment_explanation_prompt(
    user_question: str,
    context: dict[str, Any],
) -> list[dict[str, str]]:
    """Build an LLM-ready prompt from current and recent dorm telemetry."""
    latest = context.get("latest") or {}
    summary = context.get("recent_summary") or {}
    stats = summary.get("stats") or {}
    thresholds = context.get("thresholds") or {}
    events = context.get("recent_events") or []
    window = summary.get("window") or context.get("window") or "1h"

    system_prompt = (
        "你是 DormLink 宿舍环境解释助手。你的任务是根据宿舍传感器当前读数、"
        "近期统计趋势和异常事件，解释环境状态并给出可执行建议。你只能使用"
        "提供的数据，不得编造不存在的传感器信息。回答必须具体、简洁、可执行。"
    )

    user_context = f"""
当前房间：{context.get("room_id", "--")}
数据时间：{_value(latest.get("timestamp"))}
数据状态：{context.get("data_status", "mock")}

【当前传感器读数】
温度：{_value(latest.get("temperature"))} °C
湿度：{_value(latest.get("humidity"))} %
CO2：{_value(latest.get("co2"))} ppm
光照：{_value(latest.get("light"))} lux
噪声：{_value(latest.get("noise"))} dB
空气质量：{_value(latest.get("air_quality"))}
TVOC：{_value(latest.get("tvoc"))}
人体活动：{_motion(latest.get("motion"))}

【最近 {window} 统计】
温度：平均 {_stat(stats, "temperature", "avg")}，最低 {_stat(stats, "temperature", "min")}，最高 {_stat(stats, "temperature", "max")}，变化 {_stat(stats, "temperature", "delta")}
湿度：平均 {_stat(stats, "humidity", "avg")}，最低 {_stat(stats, "humidity", "min")}，最高 {_stat(stats, "humidity", "max")}，变化 {_stat(stats, "humidity", "delta")}
CO2：平均 {_stat(stats, "co2", "avg")}，最低 {_stat(stats, "co2", "min")}，最高 {_stat(stats, "co2", "max")}，变化 {_stat(stats, "co2", "delta")}
噪声：平均 {_stat(stats, "noise", "avg")}，最低 {_stat(stats, "noise", "min")}，最高 {_stat(stats, "noise", "max")}，变化 {_stat(stats, "noise", "delta")}
光照：平均 {_stat(stats, "light", "avg")}，最低 {_stat(stats, "light", "min")}，最高 {_stat(stats, "light", "max")}，变化 {_stat(stats, "light", "delta")}

【近期异常事件】
{_format_events(events)}

【阈值参考】
CO2 > {thresholds.get("co2_warn", 1000)} ppm：通风需要关注
CO2 > {thresholds.get("co2_high", 1500)} ppm：通风明显不足
噪声 > {thresholds.get("noise_warn", 55)} dB：可能影响休息
湿度 {thresholds.get("humidity_comfort_min", 40)}%~{thresholds.get("humidity_comfort_max", 60)}%：较舒适
温度 {thresholds.get("temperature_comfort_min", 18)}~{thresholds.get("temperature_comfort_max", 28)}°C：较舒适
光照过低：可能处于夜间或灯光关闭状态

用户问题：
{user_question}

请按以下格式回答：
结论：...
原因：...
建议：...

额外要求：
用中文回答；不要编造传感器没有提供的数据；必须引用当前或近期数据；
先给结论，再解释原因，再给建议；建议要具体可执行；
如果数据不足，要明确说明“当前数据不足，只能给出初步判断”；
不要输出过长，控制在 150~300 字；对异常指标说明风险等级：正常 / 轻度关注 / 需要处理。
""".strip()

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_context},
    ]


def _value(value: Any) -> str:
    if value is None:
        return "--"
    return str(value)


def _motion(value: Any) -> str:
    if value is None:
        return "--"
    return "有人活动" if bool(value) else "未检测到明显活动"


def _stat(stats: dict[str, Any], metric: str, key: str) -> str:
    value = (stats.get(metric) or {}).get(key)
    return "--" if value is None else str(value)


def _format_events(events: list[dict[str, Any]]) -> str:
    if not events:
        return "无明显异常事件。"
    return "\n".join(
        f"- {event.get('time', '--')}：{event.get('message', '--')}（{event.get('value', '--')}）"
        for event in events[:8]
    )
