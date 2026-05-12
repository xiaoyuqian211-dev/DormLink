import json
from pathlib import Path

from app.models import FeedbackRecord, FeedbackRequest

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "feedback.json"
_records: list[FeedbackRecord] = []


def save_feedback(payload: FeedbackRequest) -> FeedbackRecord:
    record = FeedbackRecord(**payload.model_dump())
    _records.append(record)
    _persist_records()
    return record


def list_feedback() -> list[FeedbackRecord]:
    return list(_records)


def _persist_records() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = [record.model_dump(mode="json") for record in _records]
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

