"""Runtime configuration for DormLink.

Secrets and MQTT endpoint details must come from environment variables or an
untracked .env file.
"""

from dataclasses import dataclass
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - dependency is listed in requirements.

    def load_dotenv(*_args, **_kwargs) -> bool:
        return False


load_dotenv()
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(frozen=True, slots=True)
class Settings:
    mqtt_enabled: bool = _env_bool("MQTT_ENABLED", False)
    mqtt_host: str = os.getenv("MQTT_HOST", "").strip()
    mqtt_port: int = _env_int("MQTT_PORT", 1883)
    mqtt_tls: bool = _env_bool("MQTT_TLS", False)
    mqtt_username: str = os.getenv("MQTT_USERNAME", "").strip()
    mqtt_password: str = os.getenv("MQTT_PASSWORD", "")
    mqtt_client_id: str = os.getenv("MQTT_CLIENT_ID", "").strip()
    mqtt_topic: str = os.getenv("MQTT_TOPIC", "dormlink/telemetry").strip()
    max_real_history_items: int = _env_int("REAL_HISTORY_LIMIT", 1000)
    database_path: Path = Path(
        os.getenv(
            "DATABASE_PATH",
            str(Path(__file__).resolve().parents[1] / "data" / "dormlink.db"),
        )
    )
    llm_api_key: str = os.getenv("LLM_API_KEY", "").strip()
    llm_api_url: str = os.getenv(
        "LLM_API_URL",
        "https://api.openai.com/v1/chat/completions",
    ).strip()
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()

    @property
    def sensor_mode(self) -> str:
        return "mqtt" if self.mqtt_enabled else "mock"


settings = Settings()
