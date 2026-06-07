"""Sensor data source abstraction for DormLink."""

from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
import math
import random
import threading
from typing import Protocol

from app.config import settings
from app.mock_data import DEFAULT_BASELINE, DEVICE_ID, ROOM_ID


@dataclass(slots=True)
class SensorReading:
    room_id: str
    device_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    light: int
    air_quality: int
    co2: int
    tvoc: float
    motion: bool
    noise: int
    signal_strength: int
    persons: int = 0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class SensorSourceSnapshot:
    has_real_data: bool
    last_seen: datetime | None
    fallback: bool


class BaseSensorProvider(Protocol):
    """Contract for any sensor data source used by the service layer."""

    def get_current_reading(self) -> SensorReading:
        """Return the newest reading from mock data, HTTP upload cache, or hardware."""

    def get_history(self, range_value: str = "1h") -> list[SensorReading]:
        """Return recent time-series readings for charts and prediction."""

    def ingest_reading(self, reading: SensorReading) -> None:
        """Accept uploaded telemetry from a real device or integration bridge."""

    def get_source_snapshot(self) -> SensorSourceSnapshot:
        """Return lightweight source state for health/status displays."""


class MockSensorProvider:
    """Small in-memory provider that simulates a dorm sensor terminal."""

    def __init__(self) -> None:
        self._history: list[SensorReading] = []
        self._seed_history()

    def get_current_reading(self) -> SensorReading:
        return self._make_reading(datetime.now(timezone.utc))

    def get_history(self, range_value: str = "1h") -> list[SensorReading]:
        minutes = _parse_range_minutes(range_value)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        data = [item for item in self._history if item.timestamp >= cutoff]
        if not data:
            self._seed_history(minutes=minutes)
            data = [item for item in self._history if item.timestamp >= cutoff]
        return data

    def ingest_reading(self, reading: SensorReading) -> None:
        self._history.append(reading)
        self._trim_history()

    def get_source_snapshot(self) -> SensorSourceSnapshot:
        return SensorSourceSnapshot(has_real_data=False, last_seen=None, fallback=True)

    def _seed_history(self, minutes: int = 60) -> None:
        now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        start = now - timedelta(minutes=minutes)
        count = int(minutes / 5) + 1
        self._history = [
            self._make_reading(start + timedelta(minutes=index * 5), index)
            for index in range(count)
        ]

    def _make_reading(
        self, timestamp: datetime, index: int | None = None
    ) -> SensorReading:
        phase_seed = index if index is not None else timestamp.minute
        phase = phase_seed / 12 * math.pi

        temperature = DEFAULT_BASELINE["temperature"] + math.sin(phase) * 0.7
        humidity = DEFAULT_BASELINE["humidity"] + math.cos(phase / 1.4) * 2.8
        co2 = DEFAULT_BASELINE["co2"] + int(math.sin(phase / 1.6) * 90)
        air_quality = DEFAULT_BASELINE["air_quality"] + int(math.sin(phase / 1.3) * 7)

        return SensorReading(
            room_id=ROOM_ID,
            device_id=DEVICE_ID,
            timestamp=timestamp,
            temperature=round(temperature + random.uniform(-0.25, 0.25), 1),
            humidity=round(humidity + random.uniform(-1.2, 1.2), 1),
            light=max(40, int(DEFAULT_BASELINE["light"] + random.randint(-35, 45))),
            air_quality=max(0, min(100, air_quality + random.randint(-3, 3))),
            co2=max(420, co2 + random.randint(-45, 55)),
            tvoc=round(DEFAULT_BASELINE["tvoc"] + random.uniform(-0.08, 0.08), 2),
            motion=random.random() > 0.12,
            noise=max(20, int(DEFAULT_BASELINE["noise"] + random.randint(-6, 8))),
            signal_strength=int(
                DEFAULT_BASELINE["signal_strength"] + random.randint(-4, 4)
            ),
            persons=1 if random.random() > 0.12 else 0,
        )

    def _trim_history(self) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._history = [item for item in self._history if item.timestamp >= cutoff]


class HybridSensorProvider:
    """Prefer recent real readings, then fall back to mock readings."""

    def __init__(
        self,
        mock_provider: MockSensorProvider | None = None,
        history_limit: int = settings.max_real_history_items,
    ) -> None:
        self._mock_provider = mock_provider or MockSensorProvider()
        self._latest_real_reading: SensorReading | None = None
        self._real_history: list[SensorReading] = []
        self._history_limit = history_limit
        self._lock = threading.Lock()

    def get_current_reading(self) -> SensorReading:
        with self._lock:
            latest = self._latest_real_reading
            if latest is not None:
                return latest
        return self._mock_provider.get_current_reading()

    def get_history(self, range_value: str = "1h") -> list[SensorReading]:
        minutes = _parse_range_minutes(range_value)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        with self._lock:
            has_real_history = bool(self._real_history)
            data = [
                item
                for item in self._real_history
                if _ensure_aware(item.timestamp) >= cutoff
            ]
        if data:
            data.sort(key=lambda item: _ensure_aware(item.timestamp))
            return data
        if has_real_history:
            return []
        return self._mock_provider.get_history(range_value)

    def ingest_reading(self, reading: SensorReading) -> None:
        normalized = _normalize_reading(reading)
        with self._lock:
            self._latest_real_reading = normalized
            self._real_history.append(normalized)
            self._trim_real_history()

    def get_source_snapshot(self) -> SensorSourceSnapshot:
        with self._lock:
            latest = self._latest_real_reading
            if latest is None:
                return SensorSourceSnapshot(
                    has_real_data=False,
                    last_seen=None,
                    fallback=True,
                )
            return SensorSourceSnapshot(
                has_real_data=True,
                last_seen=latest.timestamp,
                fallback=False,
            )

    def _trim_real_history(self) -> None:
        if len(self._real_history) > self._history_limit:
            self._real_history = self._real_history[-self._history_limit :]


def _normalize_reading(reading: SensorReading) -> SensorReading:
    reading.timestamp = _ensure_aware(reading.timestamp)
    reading.persons = max(0, min(5, int(reading.persons)))
    return reading


def _ensure_aware(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


def _parse_range_minutes(range_value: str) -> int:
    normalized = range_value.strip().lower()
    try:
        if normalized.endswith("min"):
            return max(5, int(normalized.removesuffix("min")))
        if normalized.endswith("h"):
            return max(1, int(normalized.removesuffix("h"))) * 60
        if normalized.endswith("d"):
            return max(1, int(normalized.removesuffix("d"))) * 24 * 60
    except ValueError:
        return 60
    return 60


sensor_provider: BaseSensorProvider = HybridSensorProvider()
