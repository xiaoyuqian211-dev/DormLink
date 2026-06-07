# DormLink｜AIoT 宿舍环境智联系统

DormLink 是一个面向宿舍场景的 AIoT 环境监测与智能解释系统。系统通过 MQTT 接入真实传感器数据，后端完成数据解析、SQLite 持久化、历史趋势统计和 AI 上下文构造，前端提供实时总览、历史趋势、数字孪生和智能解释助手等可视化功能。

当前项目已跑通真实数据链路：

```text
STM32 / ESP32 / 传感器设备
        ↓ MQTT Publish
阿里云 Mosquitto Broker
        ↓ topic: dormlink/telemetry
FastAPI 后端 MQTT Bridge
        ↓ 数据解析 + SQLite 持久化
Telemetry API / Assistant API
        ↓
React 前端可视化与智能问答
```

---

## 1. 项目功能

### 1.1 实时环境总览

实时展示宿舍当前环境状态，包括：

* 温度
* 湿度
* CO₂
* 光照
* 噪声
* 空气质量
* TVOC
* 人体活动状态
* 设备信号强度

页面会根据最新传感器数据生成当前关注项和环境健康评分。

### 1.2 历史趋势分析

系统将 MQTT 数据写入 SQLite 数据库，实现历史记录持久化。历史趋势页面支持：

* 今日数据
* 近 7 天数据
* 近 30 天数据
* 自定义时间范围
* 多指标切换
* 当前值、峰值、低点统计
* 数据连续性状态展示

后端重启后，历史数据不会丢失。

### 1.3 数字孪生空间视图

数字孪生页面用于将宿舍传感器读数映射到空间场景中，展示：

* 房间状态
* 传感器点位
* 温度、湿度、CO₂、光照、噪声标签
* 区域环境判断
* 局部风险提示

该页面已接入真实 telemetry 数据，不再默认使用固定模拟数据。

### 1.4 AI 环境解释助手

智能解释页基于数据库中的当前数据和近期统计数据构建问答上下文，可以回答：

* 为什么 CO₂ 偏高？
* 现在是否适合睡眠？
* 建议开窗多久？
* 最近一小时环境有什么变化？
* 哪个指标最需要关注？

系统会优先调用配置的大模型接口；如果没有配置 `LLM_API_KEY`，则使用规则版 fallback，但回答仍然基于数据库中的真实 latest、summary 和 recent events。

---

## 2. 技术栈

### 前端

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts / 自定义可视化组件

### 后端

* Python
* FastAPI
* Uvicorn
* paho-mqtt
* SQLite
* Python 标准库 `sqlite3`

### 消息与数据

* MQTT Broker：Mosquitto
* MQTT Topic：`dormlink/telemetry`
* 数据持久化：SQLite
* 数据库文件：`backend/data/dormlink.db`

---

## 3. 项目结构

```text
DormLink
├── backend
│   ├── app
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── mqtt_bridge.py
│   │   ├── database.py
│   │   ├── ai_prompt.py
│   │   ├── routers
│   │   │   ├── telemetry.py
│   │   │   └── chat.py
│   │   └── services
│   │       ├── telemetry_service.py
│   │       └── assistant_service.py
│   └── data
│       └── dormlink.db
│
├── frontend
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── pages
│   │   │   ├── Overview.tsx
│   │   │   ├── History.tsx
│   │   │   ├── DigitalTwin.tsx
│   │   │   └── Assistant.tsx
│   │   ├── types.ts
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```

---

## 4. 数据流说明

### 4.1 MQTT 数据接入

设备端向 MQTT Broker 发布数据：

```text
topic: dormlink/telemetry
```

Payload 示例：

```json
{
  "room_id": "Dorm-A101",
  "device_id": "DL-STM32-001",
  "temperature": 28.8,
  "humidity": 45.1,
  "light": 0,
  "air_quality": 87,
  "co2": 1153,
  "tvoc": 0.08,
  "motion": true,
  "noise": 53,
  "signal_strength": -70
}
```

后端 `mqtt_bridge.py` 会订阅该 topic，收到消息后完成：

1. 解码 MQTT payload
2. 解析 JSON
3. 补充 timestamp
4. 更新 latest telemetry
5. 写入 SQLite 数据库
6. 供前端 API 查询

### 4.2 SQLite 持久化

数据库文件默认位于：

```text
backend/data/dormlink.db
```

核心表：

```text
telemetry_records
```

字段：

```text
id
timestamp
room_id
device_id
temperature
humidity
light
air_quality
co2
tvoc
motion
noise
signal_strength
raw_payload
created_at
```

已建立索引：

```text
timestamp
room_id + timestamp
```

因此系统可以支持按房间和时间范围查询历史记录。

### 4.3 AI 问答上下文

智能解释模块不会直接把用户问题丢给大模型，而是先构造结构化上下文：

```text
当前最新数据 latest
+ 最近 1h / 6h / 24h 统计 summary
+ 近期异常事件 recent_events
+ 阈值参考 thresholds
+ 用户问题 question
→ Prompt Builder
→ LLM 或规则 fallback
```

这样 AI 回答可以引用真实环境数据，例如：

```text
当前 CO₂ 为 1153 ppm，最近 1 小时最高为 1153 ppm，说明通风效率下降。
建议优先开窗 10 分钟，并打开门形成短时对流。
```

---

## 5. 环境变量配置

### 5.1 后端环境变量

在 `backend/.env` 中配置：

```env
MQTT_HOST=your-mqtt-broker-public-ip
MQTT_PORT=1883
MQTT_USERNAME=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password
MQTT_TOPIC=dormlink/telemetry

DATABASE_PATH=backend/data/dormlink.db

LLM_API_KEY=
LLM_API_URL=
LLM_MODEL=
```

注意：

* 如果后端运行在本地电脑，`MQTT_HOST` 应填写阿里云公网 IP。
* 如果后端和 Mosquitto 部署在同一台服务器上，可以使用 `127.0.0.1`。
* 不要把真实 MQTT 密码或 LLM API Key 提交到公开仓库。

### 5.2 前端环境变量

在 `frontend/.env` 或 `frontend/.env.local` 中配置：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

---

## 6. 启动方式

### 6.1 启动后端

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

后端启动后，应能看到类似日志：

```text
MQTT connected
Subscribed to dormlink/telemetry
```

当设备发送数据后，应能看到类似日志：

```text
received real payload
telemetry stored
```

### 6.2 启动前端

```powershell
cd frontend
npm install
npm run dev
```

浏览器访问：

```text
http://localhost:5174/
```

实际端口以 Vite 输出为准。

---

## 7. API 说明

### 7.1 获取最新 telemetry

```http
GET /api/telemetry/latest
```

测试：

```powershell
curl http://localhost:8000/api/telemetry/latest
```

返回示例：

```json
{
  "source": "database",
  "data_status": "real",
  "data": {
    "room_id": "Dorm-A101",
    "device_id": "DL-STM32-001",
    "timestamp": "2026-06-07T19:30:00",
    "temperature": 28.8,
    "humidity": 45.1,
    "light": 0,
    "air_quality": 87,
    "co2": 1153,
    "tvoc": 0.08,
    "motion": true,
    "noise": 53,
    "signal_strength": -70
  }
}
```

### 7.2 获取历史数据

```http
GET /api/telemetry/history?room_id=Dorm-A101&range=today
GET /api/telemetry/history?room_id=Dorm-A101&range=7d
GET /api/telemetry/history?room_id=Dorm-A101&range=30d
GET /api/telemetry/history?room_id=Dorm-A101&start=2026-06-07T00:00:00&end=2026-06-07T23:59:59
```

测试：

```powershell
curl "http://localhost:8000/api/telemetry/history?room_id=Dorm-A101&range=today"
```

### 7.3 获取近期统计摘要

```http
GET /api/telemetry/summary?room_id=Dorm-A101&window=1h
GET /api/telemetry/summary?room_id=Dorm-A101&window=6h
GET /api/telemetry/summary?room_id=Dorm-A101&window=24h
```

测试：

```powershell
curl "http://localhost:8000/api/telemetry/summary?room_id=Dorm-A101&window=1h"
```

返回内容包括：

* latest
* avg
* min
* max
* delta
* sample_count
* data_status

### 7.4 获取 AI 上下文

```http
GET /api/assistant/context?room_id=Dorm-A101&window=1h
```

测试：

```powershell
curl "http://localhost:8000/api/assistant/context?room_id=Dorm-A101&window=1h"
```

返回内容包括：

* 当前房间
* 数据状态
* 最新 telemetry
* 近期统计
* 近期异常事件
* 阈值参考
* 置信度

### 7.5 AI 问答

```http
POST /api/assistant/ask
```

请求示例：

```json
{
  "room_id": "Dorm-A101",
  "question": "为什么 CO2 偏高？",
  "window": "1h"
}
```

PowerShell 测试：

```powershell
'{"room_id":"Dorm-A101","question":"为什么 CO2 偏高？","window":"1h"}' | Set-Content ask.json
curl -X POST http://localhost:8000/api/assistant/ask -H "Content-Type: application/json" --data-binary "@ask.json"
```

---

## 8. 数据库验证

查看数据库中已有记录数量和最新时间：

```powershell
python -c "import sqlite3; c=sqlite3.connect('backend/data/dormlink.db'); print(c.execute('select count(*), max(timestamp) from telemetry_records').fetchone())"
```

查看最近 5 条数据：

```powershell
python -c "import sqlite3; c=sqlite3.connect('backend/data/dormlink.db'); rows=c.execute('select timestamp, room_id, temperature, humidity, co2, noise from telemetry_records order by timestamp desc limit 5').fetchall(); print(rows)"
```

验证持久化是否生效：

1. 启动后端并等待真实 MQTT 数据写入。
2. 查询 `/api/telemetry/history`，确认有历史数据。
3. 重启后端。
4. 再次查询 `/api/telemetry/history`。
5. 如果仍能看到重启前的数据，说明 SQLite 持久化正常。

---

## 9. 前端页面说明

### 实时总览

路径：

```text
/
```

功能：

* 显示最新环境指标
* 显示当前健康评分
* 显示当前关注项
* 展示数据来源和最近上报时间

### 历史趋势

路径：

```text
/history
```

功能：

* 从数据库历史 API 读取数据
* 支持今日、近 7 天、近 30 天、自定义范围
* 支持温度、湿度、CO₂、光照、噪声等指标切换
* 展示当前值、峰值、低点

### 数字孪生

路径：

```text
/digital-twin
```

功能：

* 将真实 telemetry 映射到宿舍空间视图
* 展示传感器点位读数
* 显示局部区域洞察
* 根据真实数据判断环境状态

### 智能解释

路径：

```text
/assistant
```

功能：

* 加载 `/api/assistant/context`
* 展示当前关键指标
* 支持快捷问题
* 调用 `/api/assistant/ask`
* 基于当前数据和近期趋势生成解释

---

## 10. AI Prompt 设计

Prompt Builder 位于：

```text
backend/app/ai_prompt.py
```

设计目标：

* 让 AI 回答必须引用真实数据
* 避免编造传感器没有提供的信息
* 结合当前数据、近期统计和异常事件
* 输出简洁、具体、可执行的宿舍环境建议

核心输入：

```text
user_question
latest telemetry
recent_summary
recent_events
thresholds
```

输出要求：

```text
结论：...
原因：...
建议：...
```

示例回答：

```text
结论：当前 CO₂ 需要关注。
原因：当前 CO₂ 为 1153 ppm，最近 1 小时最高达到 1153 ppm，已经超过 1000 ppm 的通风关注阈值，说明宿舍通风效率不足。
建议：优先开窗 10 分钟，并打开门形成短时对流；如果 15 分钟后 CO₂ 仍高于 1000 ppm，建议继续通风。
```

如果没有配置大模型接口，系统会使用规则版 fallback，但仍然基于数据库中的真实数据生成解释。

---

## 11. MQTT 调试

在服务器上订阅所有 topic：

```bash
mosquitto_sub -h 127.0.0.1 -p 1883 -u your_username -P 'your_password' -t '#' -v
```

订阅指定 topic：

```bash
mosquitto_sub -h 127.0.0.1 -p 1883 -u your_username -P 'your_password' -t 'dormlink/telemetry' -v
```

本地发布测试消息：

```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -u your_username -P 'your_password' -t 'dormlink/telemetry' -m '{"room_id":"Dorm-A101","device_id":"test","temperature":28.8,"humidity":45.1,"light":0,"air_quality":87,"co2":1153,"tvoc":0.08,"motion":true,"noise":53,"signal_strength":-70}'
```

查看 Mosquitto 日志：

```bash
sudo journalctl -u mosquitto -f
```

---

## 12. 常见问题

### 12.1 MQTT Broker 收到数据，但前端不更新

检查：

1. 后端是否启动。
2. 后端是否连接到正确的 MQTT_HOST。
3. 后端是否订阅 `dormlink/telemetry`。
4. `/api/telemetry/latest` 是否返回真实数据。
5. 前端 `VITE_API_BASE_URL` 是否指向正确后端。
6. 页面是否仍然 fallback 到 mock 数据。

### 12.2 前端显示“演示数据”

通常说明：

* 后端接口请求失败
* 数据库暂无数据
* latest telemetry 为空
* 前端环境变量仍开启 mock
* 页面没有正确接入统一 telemetry service

检查：

```powershell
curl http://localhost:8000/api/telemetry/latest
```

### 12.3 历史趋势为空

检查数据库是否有数据：

```powershell
python -c "import sqlite3; c=sqlite3.connect('backend/data/dormlink.db'); print(c.execute('select count(*) from telemetry_records').fetchone())"
```

如果数据库有数据但页面为空，检查 history API 参数和前端时间范围。

### 12.4 智能解释回答不像真实数据

检查：

```powershell
curl "http://localhost:8000/api/assistant/context?room_id=Dorm-A101&window=1h"
```

确认 context 中的 latest、recent_summary、recent_events 是否真实存在。

---

## 13. 当前进展

已完成：

* 自建 Mosquitto Broker
* MQTT 用户认证
* `dormlink/telemetry` 真实数据接入
* 后端 MQTT Bridge
* SQLite 历史数据持久化
* latest/history/summary API
* Assistant context API
* Assistant ask API
* Prompt Builder
* 规则版 fallback
* 实时总览接入真实数据
* 历史趋势接入真实数据
* 数字孪生接入真实数据
* 智能解释页接入数据库上下文

---

## 14. 后续优化方向

* 接入正式 LLM 服务，提高智能解释自然度
* 增加 WebSocket，实现前端实时推送
* 增加多房间、多设备管理
* 增加异常事件表，持久化风险事件
* 增加用户反馈机制，用于优化 AI 建议
* 增加 Docker Compose 一键部署
* 增加前端暗色模式和移动端适配
* 增加传感器离线检测与告警通知

---

## 15. 项目定位

DormLink 不是简单的传感器看板，而是一个面向宿舍场景的环境理解系统。它将传感器实时数据、历史趋势、空间映射和 AI 解释结合起来，使宿舍环境状态能够被持续记录、直观展示和自然语言解释。

项目目标是构建一个可信、可解释、可扩展的宿舍 AIoT 智能环境平台。
