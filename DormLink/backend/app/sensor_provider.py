"""Sensor data source abstraction for DormLink.

The prototype uses MockSensorProvider. Later, a RealSensorProvider,
MQTTSensorProvider, or HTTPSensorProvider can implement the same protocol and
be injected into services without changing the routers.
"""

from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
import math
import random
from typing import Protocol

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

    def to_dict(self) -> dict:
        return asdict(self)


class BaseSensorProvider(Protocol):
    """Contract for any sensor data source used by the service layer."""

    def get_current_reading(self) -> SensorReading:
        """Return the newest reading from mock data, HTTP upload cache, or hardware."""

    def get_history(self, range_value: str = "1h") -> list[SensorReading]:
        """Return recent time-series readings for charts and prediction."""

    def ingest_reading(self, reading: SensorReading) -> None:
        """Accept uploaded telemetry from a real device or integration bridge."""


class MockSensorProvider:
    """Small in-memory provider that simulates a dorm sensor terminal."""

    def __init__(self) -> None:
        self._history: list[SensorReading] = []
        self._seed_history()

    def get_current_reading(self) -> SensorReading:
        return self._make_reading(datetime.now(timezone.utc))

    def get_history(self, range_value: str = "1h") -> list[SensorReading]:
        minutes = self._parse_range_minutes(range_value)
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        data = [item for item in self._history if item.timestamp >= cutoff]
        if not data:
            self._seed_history(minutes=minutes)
            data = [item for item in self._history if item.timestamp >= cutoff]
        return data

    def ingest_reading(self, reading: SensorReading) -> None:
        self._history.append(reading)
        self._trim_history()

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
        )

    def _trim_history(self) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._history = [item for item in self._history if item.timestamp >= cutoff]

    @staticmethod
    def _parse_range_minutes(range_value: str) -> int:
        normalized = range_value.strip().lower()
        if normalized.endswith("min"):
            return max(5, int(normalized.removesuffix("min")))
        if normalized.endswith("h"):
            return max(1, int(normalized.removesuffix("h"))) * 60
        return 60


sensor_provider: BaseSensorProvider = MockSensorProvider()

