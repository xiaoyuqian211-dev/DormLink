"""SQLite persistence for DormLink telemetry."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import logging
import sqlite3
import threading
from typing import Any, Iterator

from app.config import settings
from app.models import TelemetryReading

logger = logging.getLogger("uvicorn.error")
_init_lock = threading.Lock()
_initialized = False

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS telemetry_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    room_id TEXT,
    device_id TEXT,
    temperature REAL,
    humidity REAL,
    light REAL,
    air_quality REAL,
    co2 REAL,
    tvoc REAL,
    motion INTEGER,
    noise REAL,
    signal_strength REAL,
    raw_payload TEXT,
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_telemetry_records_timestamp
    ON telemetry_records(timestamp);

CREATE INDEX IF NOT EXISTS idx_telemetry_records_room_timestamp
    ON telemetry_records(room_id, timestamp);
"""

NUMERIC_FIELDS = ("temperature", "humidity", "co2", "noise", "light")


def init_database() -> None:
    """Create the SQLite database and telemetry table if needed."""
    global _initialized

    with _init_lock:
        settings.database_path.parent.mkdir(parents=True, exist_ok=True)
        with _connect() as connection:
            connection.executescript(SCHEMA_SQL)
        _initialized = True
    logger.info("Telemetry database ready path=%s", settings.database_path)


def insert_telemetry(reading: TelemetryReading, raw_payload: str | None = None) -> bool:
    """Persist one telemetry reading. Failures are logged and do not propagate."""
    try:
        _ensure_initialized()
        timestamp = _datetime_to_db(reading.timestamp)
        created_at = _datetime_to_db(datetime.now(timezone.utc))
        with _connect() as connection:
            connection.execute(
                """
                INSERT INTO telemetry_records (
                    timestamp, room_id, device_id, temperature, humidity, light,
                    air_quality, co2, tvoc, motion, noise, signal_strength,
                    raw_payload, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    timestamp,
                    reading.room_id,
                    reading.device_id,
                    reading.temperature,
                    reading.humidity,
                    reading.light,
                    reading.air_quality,
                    reading.co2,
                    reading.tvoc,
                    1 if reading.motion else 0,
                    reading.noise,
                    reading.signal_strength,
                    raw_payload or reading.model_dump_json(),
                    created_at,
                ),
            )
        return True
    except Exception:
        logger.exception(
            "Telemetry database insert failed room_id=%s device_id=%s timestamp=%s",
            reading.room_id,
            reading.device_id,
            reading.timestamp,
        )
        return False


def get_latest_telemetry(room_id: str | None = None) -> TelemetryReading | None:
    _ensure_initialized()
    where, params = _room_filter(room_id)
    query = f"""
        SELECT * FROM telemetry_records
        {where}
        ORDER BY timestamp DESC, id DESC
        LIMIT 1
    """
    with _connect() as connection:
        row = connection.execute(query, params).fetchone()
    return _row_to_reading(row) if row else None


def query_telemetry_history(
    *,
    room_id: str | None = None,
    range_value: str = "1h",
    start: str | None = None,
    end: str | None = None,
) -> list[TelemetryReading]:
    _ensure_initialized()
    start_dt, end_dt = _resolve_time_window(range_value, start, end)
    clauses: list[str] = []
    params: list[Any] = []
    if room_id:
        clauses.append("room_id = ?")
        params.append(room_id)
    if start_dt:
        clauses.append("timestamp >= ?")
        params.append(_datetime_to_db(start_dt))
    if end_dt:
        clauses.append("timestamp <= ?")
        params.append(_datetime_to_db(end_dt))

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    query = f"""
        SELECT * FROM telemetry_records
        {where}
        ORDER BY timestamp ASC, id ASC
    """
    with _connect() as connection:
        rows = connection.execute(query, params).fetchall()
    return [_row_to_reading(row) for row in rows]


def build_telemetry_summary(
    *,
    room_id: str | None = None,
    window: str = "1h",
) -> dict[str, Any]:
    readings = query_telemetry_history(room_id=room_id, range_value=window)
    latest = get_latest_telemetry(room_id) if not readings else readings[-1]
    stats = {field: _stat_for(readings, field) for field in NUMERIC_FIELDS}
    return {
        "room_id": room_id or (latest.room_id if latest else "Dorm-A101"),
        "window": window,
        "latest": latest.model_dump(mode="json") if latest else None,
        "stats": stats,
        "sample_count": len(readings),
        "data_status": "real" if latest else "mock",
    }


def table_info() -> list[dict[str, Any]]:
    _ensure_initialized()
    with _connect() as connection:
        rows = connection.execute("PRAGMA table_info(telemetry_records)").fetchall()
    return [dict(row) for row in rows]


def _stat_for(readings: list[TelemetryReading], field: str) -> dict[str, float | None]:
    values = [float(getattr(item, field)) for item in readings if getattr(item, field, None) is not None]
    if not values:
        return {"avg": None, "min": None, "max": None, "delta": None}
    avg = sum(values) / len(values)
    return {
        "avg": _round_metric(avg),
        "min": _round_metric(min(values)),
        "max": _round_metric(max(values)),
        "delta": _round_metric(values[-1] - values[0]),
    }


def _round_metric(value: float) -> float:
    return round(value, 2 if abs(value) < 10 else 1)


def _ensure_initialized() -> None:
    if not _initialized:
        init_database()


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(settings.database_path, timeout=10, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def _room_filter(room_id: str | None) -> tuple[str, list[Any]]:
    if not room_id:
        return "", []
    return "WHERE room_id = ?", [room_id]


def _row_to_reading(row: sqlite3.Row) -> TelemetryReading:
    return TelemetryReading(
        room_id=row["room_id"] or "Dorm-A101",
        device_id=row["device_id"] or "--",
        timestamp=row["timestamp"],
        temperature=row["temperature"],
        humidity=row["humidity"],
        light=int(row["light"] or 0),
        air_quality=int(row["air_quality"] or 0),
        co2=int(row["co2"] or 0),
        tvoc=row["tvoc"] or 0,
        motion=bool(row["motion"]),
        noise=int(row["noise"] or 0),
        signal_strength=int(row["signal_strength"] or 0),
        persons=0,
    )


def _resolve_time_window(
    range_value: str,
    start: str | None,
    end: str | None,
) -> tuple[datetime | None, datetime | None]:
    if start or end:
        return _parse_datetime(start) if start else None, _parse_datetime(end) if end else None

    normalized = (range_value or "1h").strip().lower()
    now = datetime.now(timezone.utc)
    if normalized == "today":
        local_now = datetime.now().astimezone()
        local_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
        return local_start.astimezone(timezone.utc), now
    if normalized == "7d":
        return now - timedelta(days=7), now
    if normalized == "30d":
        return now - timedelta(days=30), now
    if normalized.endswith("h"):
        return now - timedelta(hours=_safe_int(normalized[:-1], 1)), now
    if normalized.endswith("d"):
        return now - timedelta(days=_safe_int(normalized[:-1], 1)), now
    if normalized.endswith("min"):
        return now - timedelta(minutes=_safe_int(normalized[:-3], 60)), now
    return now - timedelta(hours=1), now


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.astimezone()
    return parsed.astimezone(timezone.utc)


def _datetime_to_db(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _safe_int(value: str, default: int) -> int:
    try:
        return max(1, int(value))
    except ValueError:
        return default
