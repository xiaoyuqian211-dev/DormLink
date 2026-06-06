# DormLink Backend

FastAPI 后端负责提供 DormLink 原型的传感器数据、环境状态判断、短时预测、数字孪生状态、用户反馈和智能解释接口。

## 启动

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows 可写 .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API

```text
GET  /api/v1/health
GET  /api/v1/telemetry/current
GET  /api/v1/telemetry/history?range=1h
POST /api/v1/telemetry/upload
GET  /api/v1/telemetry/state
GET  /api/v1/telemetry/source
GET  /api/v1/prediction/short-term?horizon=30min
GET  /api/v1/twin/state
POST /api/v1/feedback
POST /api/v1/chat/ask
```

## MQTT Data Source

DormLink runs with mock data by default. Set `MQTT_ENABLED=true` to make the
backend connect to an MQTT broker at startup and subscribe to the telemetry
topic. Do not commit a real `.env` file or real MQTT credentials.

```powershell
cd backend
$env:MQTT_ENABLED="true"
$env:MQTT_HOST="101.132.127.119"
$env:MQTT_PORT="1883"
$env:MQTT_USERNAME="dorm_embedded"
$env:MQTT_PASSWORD="your_password"
$env:MQTT_TOPIC="dormlink/telemetry"
python -m uvicorn app.main:app --reload --port 8000
```

You can also copy `.env.example` to `.env` locally and fill in your real values:

```dotenv
MQTT_ENABLED=true
MQTT_HOST=101.132.127.119
MQTT_PORT=1883
MQTT_USERNAME=dorm_embedded
MQTT_PASSWORD=your_password
MQTT_CLIENT_ID=
MQTT_TOPIC=dormlink/telemetry
```

Expected payload on `dormlink/telemetry`:

```json
{
  "room_id": "Dorm-A101",
  "device_id": "DL-DEVICE-001",
  "temperature": 25.3,
  "humidity": 62.1,
  "light": 450,
  "air_quality": 38,
  "co2": 680,
  "tvoc": 0.12,
  "motion": true,
  "noise": 35,
  "signal_strength": 24,
  "persons": 2
}
```

`timestamp` is optional. If it is missing, the backend stores the current UTC
time before validating the message with `TelemetryReading`.
`MQTT_CLIENT_ID` is optional. Leave it empty to let the backend generate a
unique client id for the current process.

Quick check:

1. Start the backend and confirm logs show `MQTT connected` and `MQTT subscribed`.
2. Send the sample payload to `dormlink/telemetry`.
3. Open `http://localhost:8000/api/v1/telemetry/current` and confirm the latest MQTT values are returned.
4. Open `http://localhost:8000/api/v1/telemetry/history?range=1h` and confirm the real reading appears in history.
5. Open `http://localhost:8000/api/v1/telemetry/source` to verify mode, topic, last seen time, and fallback state.

If `MQTT_ENABLED` is not `true`, `MQTT_HOST` is empty, or dependencies are not
installed, the API falls back to mock readings so the pages keep rendering.

## 架构说明

- `sensor_provider.py`：定义 `SensorReading`、`BaseSensorProvider` 和 `MockSensorProvider`
- `telemetry_service.py`：处理原始遥测数据和环境状态判断
- `prediction_service.py`：根据历史数据做规则版短时趋势判断
- `twin_service.py`：把环境状态映射为数字孪生区域状态
- `feedback_service.py`：保存用户反馈到内存和本地 JSON 文件
- `explanation_service.py`：规则版智能解释，占位给后续 RAG + LLM
- `routers/`：只负责 HTTP 请求和响应，不直接写业务规则

## 真实传感器预留

当前 `MockSensorProvider` 只生成 mock 数据。后续真实设备可以有两种接入方式：

- HTTP：设备直接请求 `POST /api/v1/telemetry/upload`
- MQTT：服务端或边缘桥接程序订阅设备 Topic，解析后调用 `receive_uploaded_telemetry`

业务层只依赖 `BaseSensorProvider` 协议，因此替换真实数据源时不需要重写路由。
