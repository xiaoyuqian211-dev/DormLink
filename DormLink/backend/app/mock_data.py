"""Shared constants used by the mock prototype.

Mock values live outside routers so the data source can be replaced later
without changing API handlers or front-end contracts.
"""

ROOM_ID = "Dorm-A101"
DEVICE_ID = "DL-DEVICE-001"

DEFAULT_BASELINE = {
    "temperature": 28.2,
    "humidity": 71.5,
    "light": 320,
    "air_quality": 84,
    "co2": 960,
    "tvoc": 0.42,
    "motion": True,
    "noise": 42,
    "signal_strength": -71,
}

ZONE_DEFINITIONS = [
    {"zone_id": "window", "name": "窗户区域"},
    {"zone_id": "desk", "name": "学习区"},
    {"zone_id": "bed", "name": "床铺区"},
    {"zone_id": "door", "name": "门口区域"},
]

