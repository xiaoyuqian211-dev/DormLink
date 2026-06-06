"""MQTT subscriber bridge for DormLink telemetry."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
import os
import threading
from typing import Any
import uuid

from app.config import settings
from app.models import TelemetryReading
from app.services.telemetry_service import receive_uploaded_telemetry

try:
    import paho.mqtt.client as mqtt
except ImportError:  # pragma: no cover - dependency is listed in requirements.
    mqtt = None


logger = logging.getLogger("uvicorn.error")
_client: Any | None = None
_client_id: str | None = None
_running = False
_lock = threading.Lock()


def start_mqtt_bridge() -> None:
    """Start the MQTT subscriber if MQTT_ENABLED is true."""
    global _client, _client_id, _running

    if not settings.mqtt_enabled:
        logger.info("MQTT bridge disabled: MQTT_ENABLED is not true")
        return

    if not settings.mqtt_host:
        logger.warning("MQTT bridge not started: MQTT_HOST is empty")
        return

    if mqtt is None:
        logger.warning("MQTT bridge not started: paho-mqtt is not installed")
        return

    with _lock:
        if _running and _client is not None:
            logger.info("MQTT bridge already running client_id=%s", _client_id)
            return

        _client_id = _resolve_client_id()
        client = _create_client(_client_id)
        client.on_connect = _on_connect
        client.on_message = _on_message
        client.on_disconnect = _on_disconnect
        client.reconnect_delay_set(min_delay=1, max_delay=30)

        if settings.mqtt_username:
            client.username_pw_set(settings.mqtt_username, settings.mqtt_password or None)

        if settings.mqtt_tls:
            client.tls_set()

        logger.info(
            "MQTT connecting host=%s port=%s topic=%s client_id=%s",
            settings.mqtt_host,
            settings.mqtt_port,
            settings.mqtt_topic,
            _client_id,
        )
        try:
            client.connect_async(settings.mqtt_host, settings.mqtt_port, keepalive=60)
            client.loop_start()
        except Exception:
            logger.exception("MQTT connection start failed client_id=%s", _client_id)
            _client = None
            _client_id = None
            _running = False
            return

        _client = client
        _running = True


def stop_mqtt_bridge() -> None:
    """Stop the MQTT subscriber if it was started."""
    global _client, _client_id, _running

    with _lock:
        if _client is None:
            _client_id = None
            _running = False
            return

        client = _client
        client_id = _client_id
        _client = None
        _client_id = None
        _running = False
    try:
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT bridge stopped client_id=%s", client_id)
    except Exception:
        logger.exception("MQTT bridge cleanup failed client_id=%s", client_id)


def _create_client(client_id: str) -> Any:
    if hasattr(mqtt, "CallbackAPIVersion"):
        return mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
    return mqtt.Client(client_id=client_id)


def _resolve_client_id() -> str:
    configured = os.getenv("MQTT_CLIENT_ID", "").strip()
    if configured:
        return configured
    return f"dormlink-backend-{os.getpid()}-{uuid.uuid4().hex[:8]}"


def _on_connect(
    client: Any,
    _userdata: Any,
    _flags: Any,
    reason_code: Any,
    *_args: Any,
) -> None:
    code = _reason_code_value(reason_code)
    if code != 0:
        logger.warning("MQTT connect failed reason=%s", reason_code)
        return

    logger.info("MQTT connected client_id=%s", _client_id)
    result, mid = client.subscribe(settings.mqtt_topic)
    logger.info(
        "MQTT subscribed topic=%s result=%s mid=%s",
        settings.mqtt_topic,
        result,
        mid,
    )


def _on_message(_client: Any, _userdata: Any, message: Any) -> None:
    topic = getattr(message, "topic", "")
    payload_bytes = getattr(message, "payload", b"")
    logger.info("MQTT message received topic=%s bytes=%s", topic, len(payload_bytes))

    try:
        raw_payload = payload_bytes.decode("utf-8")
        data = json.loads(raw_payload)
        if not isinstance(data, dict):
            raise ValueError("MQTT payload must be a JSON object")

        if not data.get("timestamp"):
            data["timestamp"] = _utc_now()

        reading = TelemetryReading(**data)
        receive_uploaded_telemetry(reading)
    except Exception:
        logger.exception("MQTT payload parse failed topic=%s", topic)
        return

    logger.info(
        "MQTT telemetry stored room_id=%s device_id=%s timestamp=%s",
        reading.room_id,
        reading.device_id,
        reading.timestamp.isoformat(),
    )


def _on_disconnect(_client: Any, _userdata: Any, *args: Any) -> None:
    reason_code = _extract_disconnect_reason_code(args)
    rc = _reason_code_value(reason_code)
    logger.warning(
        "MQTT disconnected client_id=%s rc=%s reason_code=%s",
        _client_id,
        rc,
        reason_code,
    )


def _reason_code_value(reason_code: Any) -> int:
    if hasattr(reason_code, "value"):
        return int(reason_code.value)
    try:
        return int(reason_code)
    except (TypeError, ValueError):
        return -1


def _extract_disconnect_reason_code(args: tuple[Any, ...]) -> Any:
    if not args:
        return "unknown"
    if len(args) == 1:
        return args[0]
    return args[1]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)
