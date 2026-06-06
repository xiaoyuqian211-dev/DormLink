# DormLink

DormLink 是一个面向高校宿舍场景的 AIoT 环境智联系统原型。项目目标是把宿舍中的温度、湿度、光照、空气质量、CO2、人体存在等环境数据接入后端，再通过前端完成实时总览、历史趋势、短时预测、数字孪生、智能解释和用户反馈闭环。

当前版本已经完成前后端主流程、Mock 数据兜底、MQTT 数据接入和 ConnectLab / 自建 MQTT Broker 联调预留。默认情况下系统会使用 Mock 传感器数据，开启 MQTT 后，后端会订阅指定 Topic，并把真实设备上报的数据写入统一的传感器数据层。

## 当前进展

- 前端已完成实时总览、历史趋势、数字孪生、智能解释四个主要页面。
- 后端已完成 FastAPI 接口层、服务层和传感器数据源抽象。
- 默认支持 Mock 数据，保证没有硬件时也可以完整展示页面。
- 已接入 MQTT Bridge，支持通过环境变量连接 ConnectLab 或自建 MQTT Broker。
- 已增加 `HybridSensorProvider`，优先使用真实 MQTT / HTTP 上报数据，数据不足时自动回退到 Mock 数据。
- 已增加 `/api/v1/telemetry/source`，前端可以显示当前数据源、Topic、最近真实数据时间和 fallback 状态。
- MQTT client 不再使用固定 client id，未配置时会自动生成唯一 client id，避免后端重复启动或多人联调时互相顶号。
- 后端启动和关闭时会自动启动 / 停止 MQTT Bridge，避免残留 MQTT client。
- 已预留真实传感器接入协议，队友只需要按约定 Topic 和 JSON Payload 上报即可。

## 技术栈

### Backend

- Python
- FastAPI
- Pydantic v2
- Uvicorn
- paho-mqtt
- python-dotenv

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts
- Three.js
- @react-three/fiber
- @react-three/drei
- lucide-react

## 项目结构

```text
DormLink/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI 入口，注册路由和生命周期
│   │   ├── config.py                   # 环境变量配置，包括 MQTT 配置
│   │   ├── models.py                   # API 请求 / 响应模型
│   │   ├── mock_data.py                # Mock 基准数据和区域定义
│   │   ├── sensor_provider.py          # Mock + Hybrid 数据源抽象
│   │   ├── mqtt_bridge.py              # MQTT 订阅桥接
│   │   ├── routers/
│   │   │   ├── telemetry.py            # 遥测数据接口
│   │   │   ├── prediction.py           # 短时预测接口
│   │   │   ├── twin.py                 # 数字孪生接口
│   │   │   ├── feedback.py             # 用户反馈接口
│   │   │   └── chat.py                 # 智能解释接口
│   │   └── services/
│   │       ├── telemetry_service.py    # 环境状态判断和数据转换
│   │       ├── prediction_service.py   # 规则版短时趋势预测
│   │       ├── twin_service.py         # 数字孪生状态映射
│   │       ├── feedback_service.py     # 用户反馈保存
│   │       └── explanation_service.py  # 规则版智能解释
│   ├── .env.example                    # 环境变量模板
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # 前端 API 封装
│   │   ├── pages/                      # Dashboard / History / DigitalTwin / Assistant
│   │   ├── components/                 # 页面组件和 UI 组件
│   │   ├── types.ts                    # 前端 API 类型
│   │   └── main.tsx
│   ├── package.json
│   └── README.md
├── displays/                           # 项目展示截图
└── README.md
```

## 快速启动

### 1. 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Windows PowerShell 可使用：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

后端默认运行在：

```text
http://localhost:8000
```

健康检查：

```text
GET http://localhost:8000/api/v1/health
```

正常返回示例：

```json
{
  "status": "ok",
  "project": "DormLink",
  "message": "DormLink backend is running"
}
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在：

```text
http://localhost:5173
```

前端默认请求后端：

```text
http://localhost:8000
```

如需修改后端地址，可设置：

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Windows PowerShell：

```powershell
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

## 环境变量配置

后端支持从系统环境变量或 `backend/.env` 读取配置。真实账号、密码、Token 不要提交到 Git 仓库。

可复制模板：

```bash
cd backend
cp .env.example .env
```

`.env.example` 当前内容：

```dotenv
MQTT_ENABLED=false
MQTT_HOST=
MQTT_PORT=1883
MQTT_TLS=false
MQTT_USERNAME=
MQTT_PASSWORD=your_password
MQTT_CLIENT_ID=
MQTT_TOPIC=dormlink/telemetry
```

字段说明：

| 字段 | 说明 |
|---|---|
| `MQTT_ENABLED` | 是否启用 MQTT，设为 `true` 后后端启动时会连接 Broker |
| `MQTT_HOST` | MQTT Broker 地址，可以是 ConnectLab 地址或自建服务器公网 IP |
| `MQTT_PORT` | MQTT 端口，非 TLS 通常为 `1883`，TLS 通常为 `8883` |
| `MQTT_TLS` | 是否启用 TLS / SSL |
| `MQTT_USERNAME` | MQTT 用户名 |
| `MQTT_PASSWORD` | MQTT 密码或 Token |
| `MQTT_CLIENT_ID` | 可选，留空时后端自动生成唯一 client id |
| `MQTT_TOPIC` | 设备上报 Topic，默认 `dormlink/telemetry` |

## Mock 模式

如果不配置 MQTT，系统默认运行在 Mock 模式：

```dotenv
MQTT_ENABLED=false
```

此时后端会自动生成模拟传感器数据，前端所有页面仍然可以正常展示，适合课堂演示、前端开发和无硬件联调。

Mock 模式下数据源接口返回类似：

```json
{
  "mode": "mock",
  "topic": "dormlink/telemetry",
  "has_real_data": false,
  "last_seen": null,
  "fallback": true
}
```

## MQTT 模式

### 1. PowerShell 临时启动示例

```powershell
cd backend
$env:MQTT_ENABLED="true"
$env:MQTT_HOST="your_mqtt_host"
$env:MQTT_PORT="1883"
$env:MQTT_TLS="false"
$env:MQTT_USERNAME="your_username"
$env:MQTT_PASSWORD="your_password"
$env:MQTT_CLIENT_ID=""
$env:MQTT_TOPIC="dormlink/telemetry"
python -m uvicorn app.main:app --reload --port 8000
```

### 2. `.env` 启动示例

在 `backend/.env` 中写入：

```dotenv
MQTT_ENABLED=true
MQTT_HOST=your_mqtt_host
MQTT_PORT=1883
MQTT_TLS=false
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_CLIENT_ID=
MQTT_TOPIC=dormlink/telemetry
```

然后启动：

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. 后端日志判断

启动成功后，日志中应能看到类似信息：

```text
MQTT connecting host=your_mqtt_host port=1883 topic=dormlink/telemetry client_id=dormlink-backend-xxxx-xxxxxxxx
MQTT connected client_id=dormlink-backend-xxxx-xxxxxxxx
MQTT subscribed topic=dormlink/telemetry result=0 mid=1
```

收到设备消息后，应能看到：

```text
MQTT message received topic=dormlink/telemetry bytes=...
MQTT telemetry stored room_id=Dorm-A101 device_id=DL-DEVICE-001 timestamp=...
```

## MQTT 消息格式

设备需要向 `MQTT_TOPIC` 发布 JSON 对象。字段应符合后端 `TelemetryReading` 模型。

最小推荐 Payload：

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
  "signal_strength": -55,
  "persons": 2
}
```

完整 Payload 可附带 `timestamp`：

```json
{
  "room_id": "Dorm-A101",
  "device_id": "DL-DEVICE-001",
  "timestamp": "2026-06-07T01:00:00Z",
  "temperature": 25.3,
  "humidity": 62.1,
  "light": 450,
  "air_quality": 38,
  "co2": 680,
  "tvoc": 0.12,
  "motion": true,
  "noise": 35,
  "signal_strength": -55,
  "persons": 2
}
```

说明：

- `timestamp` 可选；如果缺失，后端会自动补当前 UTC 时间。
- `persons` 表示宿舍内人数估计值，后端会限制在 `0~5`。
- `signal_strength` 建议使用 RSSI，例如 `-55`。
- `motion` 表示是否检测到人体活动。
- `air_quality` 当前按 `0~100` 风险值处理，数值越高表示空气质量风险越高。
- `co2` 单位建议为 ppm。
- `tvoc` 单位可由硬件端统一约定，当前前端只作为环境指标展示。

## MQTT 本地发布测试

如果本机安装了 Mosquitto 客户端，可以用下面命令模拟传感器上报。

无账号密码：

```bash
mosquitto_pub \
  -h your_mqtt_host \
  -p 1883 \
  -t dormlink/telemetry \
  -m '{"room_id":"Dorm-A101","device_id":"DL-DEVICE-001","temperature":25.3,"humidity":62.1,"light":450,"air_quality":38,"co2":680,"tvoc":0.12,"motion":true,"noise":35,"signal_strength":-55,"persons":2}'
```

有账号密码：

```bash
mosquitto_pub \
  -h your_mqtt_host \
  -p 1883 \
  -u your_username \
  -P your_password \
  -t dormlink/telemetry \
  -m '{"room_id":"Dorm-A101","device_id":"DL-DEVICE-001","temperature":25.3,"humidity":62.1,"light":450,"air_quality":38,"co2":680,"tvoc":0.12,"motion":true,"noise":35,"signal_strength":-55,"persons":2}'
```

Windows PowerShell 可以先把 JSON 存成变量：

```powershell
$payload = '{"room_id":"Dorm-A101","device_id":"DL-DEVICE-001","temperature":25.3,"humidity":62.1,"light":450,"air_quality":38,"co2":680,"tvoc":0.12,"motion":true,"noise":35,"signal_strength":-55,"persons":2}'
mosquitto_pub -h your_mqtt_host -p 1883 -u your_username -P your_password -t dormlink/telemetry -m $payload
```

## HTTP 上报测试

除了 MQTT，后端也保留了 HTTP 上报接口，方便设备或调试脚本直接写入数据。

```bash
curl -X POST "http://localhost:8000/api/v1/telemetry/upload" \
  -H "Content-Type: application/json" \
  -d '{
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
    "signal_strength": -55,
    "persons": 2
  }'
```

正常返回：

```json
{
  "success": true,
  "message": "Telemetry received and stored."
}
```

## 联调验证流程

前后端和 MQTT Broker 都启动后，按下面顺序检查：

1. 打开后端健康检查。

```text
GET http://localhost:8000/api/v1/health
```

2. 查看当前数据源状态。

```text
GET http://localhost:8000/api/v1/telemetry/source
```

3. 发布一条 MQTT 测试数据到 `dormlink/telemetry`。

4. 查看当前最新数据。

```text
GET http://localhost:8000/api/v1/telemetry/current
```

5. 查看历史数据中是否出现真实数据。

```text
GET http://localhost:8000/api/v1/telemetry/history?range=1h
```

6. 查看环境状态判断。

```text
GET http://localhost:8000/api/v1/telemetry/state
```

7. 打开前端页面。

```text
http://localhost:5173
```

8. 在实时总览页面确认 Data source 由 `Mock fallback` 变为 `ConnectLab MQTT` 或真实数据在线状态。

## 后端 API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/v1/health` | 后端健康检查 |
| `GET` | `/api/v1/telemetry/current` | 获取当前最新遥测数据 |
| `GET` | `/api/v1/telemetry/history?range=1h` | 获取历史趋势数据，支持 `30min`、`1h`、`2h` 等格式 |
| `POST` | `/api/v1/telemetry/upload` | HTTP 方式上传遥测数据 |
| `GET` | `/api/v1/telemetry/state` | 获取环境状态、舒适度和摘要 |
| `GET` | `/api/v1/telemetry/source` | 获取当前数据源、Topic、最近真实数据时间和 fallback 状态 |
| `GET` | `/api/v1/prediction/short-term?horizon=30min` | 获取短时趋势预测和风险摘要 |
| `GET` | `/api/v1/twin/state` | 获取数字孪生区域状态和建议动作 |
| `POST` | `/api/v1/feedback` | 提交用户反馈 |
| `POST` | `/api/v1/chat/ask` | 获取规则版智能解释回答 |

## 前端页面

### 实时总览 Dashboard

- 展示温度、湿度、光照、空气质量、CO2、TVOC、噪声、人体存在、人数估计等指标。
- 展示舒适度分数和环境状态摘要。
- 展示 Data source、Topic、最近真实数据时间和在线状态。
- 周期性刷新当前遥测数据、环境状态和数据源状态。

### 历史趋势 History

- 展示温度、湿度、空气质量、CO2 等指标趋势。
- 支持不同时间范围的数据查看。
- 提供统计卡片和周期总结。
- 为后续异常检测和趋势解释预留展示区域。

### 数字孪生 DigitalTwin

- 使用 2D / 3D 风格宿舍模型展示宿舍区域状态。
- 当前区域包括窗户区域、学习区、床铺区、门口区域。
- 根据环境状态映射区域风险，例如空气质量异常时窗户区域提示通风。
- 输出未来提示和建议动作。

### 智能解释 Assistant

- 支持基于当前环境状态的规则版问答。
- 可以解释“为什么宿舍有点闷”“当前温度是否偏高”等问题。
- 支持用户反馈提交，反馈会保存到后端本地 JSON 文件。
- 后续可替换为 RAG + LLM 智能解释服务。

## 核心架构说明

### 数据源层

`backend/app/sensor_provider.py` 定义统一的数据源协议：

- `MockSensorProvider`：生成模拟数据。
- `HybridSensorProvider`：优先使用真实上报数据，真实数据不足时回退 Mock。
- `BaseSensorProvider`：约束后续真实传感器、HTTP、MQTT 等数据源的统一接口。

这样路由层和业务层不需要关心数据来自 Mock、HTTP 还是 MQTT。

### MQTT Bridge

`backend/app/mqtt_bridge.py` 负责：

- 后端启动时连接 MQTT Broker。
- 订阅 `MQTT_TOPIC`。
- 解析 JSON Payload。
- 自动补齐缺失的 `timestamp`。
- 使用 `TelemetryReading` 校验数据格式。
- 调用 `receive_uploaded_telemetry()` 写入统一数据源。
- 后端停止时关闭 MQTT loop 并断开连接。

### 服务层

`backend/app/services/` 负责业务逻辑：

- `telemetry_service.py`：数据转换、环境状态判断、舒适度计算。
- `prediction_service.py`：基于最近 1 小时数据做规则版趋势预测。
- `twin_service.py`：把环境状态映射成数字孪生区域状态。
- `explanation_service.py`：根据当前环境生成规则解释。
- `feedback_service.py`：保存用户反馈。

### 路由层

`backend/app/routers/` 只负责 HTTP 请求和响应，不直接写业务规则，方便后续维护和扩展。

## 真实传感器接入约定

硬件端或队友负责的传感器模块只需要满足下面约定：

1. 连接同一个 MQTT Broker。
2. 使用项目约定的 Topic，例如：

```text
dormlink/telemetry
```

3. 每隔固定时间发布一条 JSON 数据。
4. JSON 字段名和类型与 `TelemetryReading` 保持一致。
5. 不要和后端使用同一个 `client_id`。
6. 如果传感器端暂时没有某个指标，建议先在硬件端给默认值，保证 Payload 可以通过后端校验。

推荐硬件端字段映射：

| 后端字段 | 传感器含义 | 示例 |
|---|---|---|
| `room_id` | 宿舍或房间编号 | `Dorm-A101` |
| `device_id` | 设备编号 | `ESP32-001` |
| `temperature` | 温度 | `25.3` |
| `humidity` | 湿度 | `62.1` |
| `light` | 光照强度 | `450` |
| `air_quality` | 空气质量风险值 | `38` |
| `co2` | CO2 浓度 ppm | `680` |
| `tvoc` | TVOC 指标 | `0.12` |
| `motion` | 是否有人体活动 | `true` |
| `noise` | 噪声 | `35` |
| `signal_strength` | Wi-Fi / MQTT 信号强度 | `-55` |
| `persons` | 人数估计 | `2` |

## 与硬件队友沟通的信息

可以直接把下面内容发给负责 ESP32 / 传感器的队友：

```text
后端 MQTT 通路已经接好了。你这边只需要把传感器数据发布到同一个 MQTT Broker 的 dormlink/telemetry Topic。

请按 JSON 对象发布，字段如下：
room_id, device_id, temperature, humidity, light, air_quality, co2, tvoc, motion, noise, signal_strength, persons。

timestamp 可以不传，后端会自动补当前时间。

示例：
{
  "room_id": "Dorm-A101",
  "device_id": "ESP32-001",
  "temperature": 25.3,
  "humidity": 62.1,
  "light": 450,
  "air_quality": 38,
  "co2": 680,
  "tvoc": 0.12,
  "motion": true,
  "noise": 35,
  "signal_strength": -55,
  "persons": 2
}

注意：你的设备 client_id 不要和后端重复。后端现在会自动生成自己的 client_id。你可以用 ESP32-001 或 dormlink-esp32-001。
```

## 常见问题

### 1. 前端页面能打开，但一直是 Mock fallback

检查：

- `MQTT_ENABLED` 是否为 `true`。
- `MQTT_HOST`、`MQTT_PORT`、用户名、密码是否正确。
- 后端日志是否出现 `MQTT connected`。
- 设备是否真的向 `MQTT_TOPIC` 发布了消息。
- 发布的 JSON 是否能通过后端字段校验。

### 2. 后端日志出现 MQTT disconnected

检查：

- Broker 是否在线。
- 端口是否开放。
- 用户名密码是否正确。
- 是否多个客户端使用了同一个 client id。
- 网络或云服务器安全组是否允许对应端口。

### 3. MQTT 收到消息但 current 没变化

检查：

- Payload 是否是 JSON 对象，而不是字符串或数组。
- 字段名是否完全匹配后端模型。
- `temperature`、`humidity`、`tvoc` 应为数字。
- `light`、`air_quality`、`co2`、`noise`、`signal_strength`、`persons` 应为整数。
- `motion` 应为布尔值 `true` / `false`。

### 4. 前端请求后端失败

检查：

- 后端是否在 `http://localhost:8000` 运行。
- 前端 `VITE_API_BASE_URL` 是否设置正确。
- 浏览器控制台是否有网络错误。
- 后端 CORS 当前已允许开发环境跨域请求。

## 后续计划

- 接入真实 ESP32 传感器端，完成端到端真实数据流。
- 统一传感器端字段单位和采样频率。
- 增加设备离线判断和异常 Payload 统计。
- 将反馈数据用于个性化阈值调整。
- 将规则版解释服务替换为 RAG + LLM。
- 将数字孪生从规则映射升级为更细粒度的区域状态推理。
- 增加数据库持久化，替代当前内存历史和本地 JSON 反馈文件。
- 增加部署脚本，用于云服务器一键运行后端、前端和 MQTT Broker。

## 项目展示

如果仓库中保留了 `displays/` 目录，可在 README 中展示当前页面截图。当前压缩包中的截图文件名来自中文文件名转义，路径中 `#` 需要使用 `%23` 转义。

### 实时总览

<img src="./displays/%23U5b9e%23U65f6%23U603b%23U89c8.png" alt="实时总览" width="900">

### 历史趋势

<img src="./displays/%23U5386%23U53f2%23U8d8b%23U52bf1.png" alt="历史趋势" width="900">

### 数字孪生

<img src="./displays/%23U6570%23U5b57%23U5b6a%23U751f1.png" alt="数字孪生" width="900">

### 智能解释

<img src="./displays/%23U667a%23U80fd%23U89e3%23U91ca.png" alt="智能解释" width="900">

## 安全说明

- 不要提交真实 `.env` 文件。
- 不要把真实 MQTT 密码、Token、云服务器密码写进 README。
- README 中只保留占位符，例如 `your_mqtt_host`、`your_username`、`your_password`。
- 如果仓库曾经提交过真实密钥，应立即更换密钥，并清理 Git 历史记录。
