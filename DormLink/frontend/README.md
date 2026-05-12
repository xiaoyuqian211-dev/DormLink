# DormLink Frontend

React + Vite + TypeScript 前端，用于演示 DormLink 宿舍环境智能中控台、历史趋势、数字孪生和智能解释反馈闭环。

## 启动

```bash
cd frontend
npm install
npm run dev
```

默认访问：

```text
http://localhost:5173
```

默认后端地址：

```text
http://localhost:8000
```

如需修改后端地址，可设置环境变量：

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## 页面

- `Dashboard`：实时环境数据、舒适度分数和系统摘要，每 5 秒自动刷新
- `History`：最近 1 小时温度、湿度、空气质量和 CO2 趋势
- `DigitalTwin`：2D 宿舍区域孪生状态，展示区域风险和建议操作
- `Assistant`：规则版问答和用户反馈表单

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts
- lucide-react

