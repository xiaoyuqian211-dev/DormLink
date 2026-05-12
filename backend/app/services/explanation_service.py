from app.services.telemetry_service import get_current_telemetry, get_environment_state


def answer_question(question: str) -> str:
    """Rule-based explanation placeholder.

    Later this module can be replaced by RAG + LLM while keeping the /chat/ask
    API contract unchanged.
    """

    telemetry = get_current_telemetry()
    state = get_environment_state()
    normalized = question.strip().lower()

    if "闷" in normalized or "空气" in normalized or "co2" in normalized:
        return (
            "根据当前温度、湿度和空气质量数据，宿舍略显闷热。"
            f"当前 CO2 约为 {telemetry.co2} ppm，湿度为 {telemetry.humidity:.1f}%，"
            "主要原因可能是湿度偏高且空气流通不足。建议短时间开窗通风，并观察空气质量变化。"
        )
    if "热" in normalized or "温度" in normalized:
        return (
            f"当前温度约为 {telemetry.temperature:.1f}°C，系统判断为"
            f"{_translate_state(state.temperature_state)}。如果持续偏热，建议开启风扇或调整空调设置。"
        )
    if "湿" in normalized:
        return (
            f"当前湿度约为 {telemetry.humidity:.1f}%，系统判断为"
            f"{_translate_state(state.humidity_state)}。湿度偏高时体感会更闷，可以尝试短时通风或除湿。"
        )
    if "建议" in normalized:
        return f"{state.summary} 建议优先处理空气流通和体感温度，再观察舒适度分数变化。"

    return (
        f"{state.summary} 当前综合舒适度为 {state.comfort_score} 分。"
        "这是规则生成的原型回答，后续可以替换为 RAG + 大模型解释服务。"
    )


def _translate_state(value: str) -> str:
    mapping = {
        "hot": "偏热",
        "normal": "正常",
        "cool": "略低",
        "cold": "偏冷",
        "humid": "湿度偏高",
        "dry": "偏干",
        "moderate": "中等风险",
        "poor": "风险偏高",
        "good": "良好",
    }
    return mapping.get(value, value)

