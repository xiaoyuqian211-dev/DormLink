from app.services.assistant_service import answer_assistant_question


def answer_question(question: str, room_id: str = "Dorm-A101", window: str = "1h") -> dict:
    """Return an assistant answer using persisted telemetry context."""
    return answer_assistant_question(room_id=room_id, question=question, window=window)
