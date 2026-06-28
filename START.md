# kafka-log-analyzer 开发启动指南

> 在 `/Users/saqqdy/www/saqqdy/kafka-log-analyzer` 目录下执行以下任务

---

## 🚀 快速开始

### 任务 1：初始化项目结构

```
在当前目录初始化 Claude Code Plugin 项目：

1. 创建标准目录结构：
   - commands/          # 命令处理器
   - mcp-server/        # MCP Server 实现
   - mcp-server/tools/  # MCP Tools
   - scripts/           # 复用现有 Python 脚本（从 skills 项目复制）
   - references/         # 复用现有参考文档（从 skills 项目复制）
   - storage/           # 数据持久化
   - hooks/             # Hook 处理器
   - integrations/      # 外部集成（飞书/Slack/JIRA）

2. 创建 package.json（TypeScript 项目）
3. 创建 tsconfig.json
4. 创建 .gitignore
5. 创建 README.md（项目说明）
```

### 任务 2：创建 Plugin Manifest

```
创建 plugin.json 文件，包含：

{
  "name": "kafka-log-analyzer",
  "version": "0.1.0",
  "description": "Kafka 日志智能分析，支持实时监控、异常检测、源码联动",
  "author": "saqqdy",
  "mcpServers": {
    "kafka-analyzer": {
      "command": "node",
      "args": ["dist/mcp-server/index.js"]
    }
  },
  "commands": {
    "kafka-analyze": "分析 Kafka 日志",
    "kafka-lag": "获取消费积压指标"
  }
}
```

### 任务 3：复制现有资产

```
从 /Users/saqqdy/www/saqqdy/skills/skills/kafka-log-analyzer/ 复制以下内容：

1. scripts/ 目录所有 Python 脚本
2. references/ 目录所有参考文档
3. evals/ 目录评估数据集

保持原有文件结构和内容不变。
```

---

## 📦 阶段 1：Plugin 骨架

### 任务 4：实现 MCP Server 入口

```
创建 mcp-server/index.ts，实现基础 MCP Server：

1. 使用 @anthropic-ai/sdk 或 @modelcontextprotocol/sdk
2. 注册以下 Tools：
   - analyze_log：分析日志
   - get_lag：获取消费积压（占位）
3. 实现基础的 Tool 调用路由
4. 添加日志和错误处理

参考结构：
- MCP Server 入口
- Tool 注册和路由
- 错误处理中间件
- 配置加载（环境变量）
```

### 任务 5：实现 analyze_log Tool

```
创建 mcp-server/tools/analyze_log.ts：

功能：
- 接收 source 参数（paste | file）
- 调用 scripts/parse_kafka_log.py 解析日志
- 调用 scripts/detect_anomalies.py 检测异常
- 返回结构化分析结果

输入 Schema：
{
  source: "paste" | "file",
  content?: string,      // source=paste 时
  path?: string,         // source=file 时
  focus?: string[],      // producer,consumer,broker,lag,error
  timeline?: string      // 1m,5m,15m,1h,6h,1d
}

输出：
{
  events: Event[],
  anomalies: Anomaly[],
  summary: {
    total: number,
    byPriority: { P0: number, P1: number, P2: number, P3: number }
  }
}
```

### 任务 6：实现 /kafka-analyze 命令

```
创建 commands/kafka-analyze.ts：

功能：
- 解析命令参数（--source, --focus, --timeline 等）
- 调用 MCP Tool analyze_log
- 格式化输出为 Markdown 报告
- 支持交互式参数输入（可选）

命令签名：
/kafka-analyze [options]
  --source <type>       paste | file (默认: paste)
  --focus <areas>       producer,consumer,broker,lag,error
  --timeline <window>   1m,5m,15m,1h,6h,1d
  --priority <levels>   P0,P1,P2,P3 (默认: P0,P1)
  --report <format>     markdown | json | slack
```

### 任务 7：编写单元测试

```
创建测试文件：

1. tests/analyze_log.test.ts
   - 测试 paste 输入解析
   - 测试 file 输入解析
   - 测试时间线分析
   - 测试优先级分级

2. tests/fixtures/
   - sample-kafka-log.txt（测试日志样本）
   - expected-output.json（预期输出）

使用 Vitest 或 Jest 框架。
```

### 任务 8：构建和验证

```
完成以下构建任务：

1. 安装依赖：npm install
2. 编译 TypeScript：npm run build
3. 运行测试：npm test
4. 本地验证：
   - 启动 MCP Server
   - 调用 analyze_log Tool
   - 执行 /kafka-analyze 命令

验收标准：
- TypeScript 编译无错误
- 测试通过率 100%
- 命令可正常执行
- 输出符合预期格式
```

---

## 🔌 阶段 2：MCP 数据源（可选）

### 任务 9：实现 Prometheus 连接器

```
创建 mcp-server/connectors/prometheus.ts：

功能：
- 连接 Prometheus HTTP API
- 查询 Kafka Exporter 指标
- 支持常用查询模板：
  - kafka_consumer_lag_records
  - kafka_producer_record_send_rate
  - kafka_broker_leader_election_rate

配置：
- PROMETHEUS_URL 环境变量
- 超时和重试策略
```

### 任务 10：实现 get_lag Tool

```
创建 mcp-server/tools/get_lag.ts：

功能：
- 从 Prometheus/Kafka Exporter 拉取消费积压指标
- 支持按 cluster / consumer_group / topic 过滤
- 返回结构化 Lag 数据

输入 Schema：
{
  cluster?: string,
  consumer_group?: string,
  topic?: string
}

输出：
{
  lags: [{
    cluster: string,
    group: string,
    topic: string,
    partition: number,
    lag: number,
    timestamp: string
  }]
}
```

---

## 🪝 阶段 3：Hook 集成（可选）

### 任务 11：实现 Grafana 告警 Hook

```
创建 hooks/on_grafana_alert.ts：

功能：
- 接收 Grafana 告警 webhook
- 解析告警内容（判断是否 Kafka 相关）
- 触发 /kafka-analyze 分析
- 推送结果到飞书/Slack

配置：
- GRAFANA_WEBHOOK_PORT
- FIFTY_SLACK_WEBHOOK_URL
```

---

## 📝 开发流程模板

### 每日开始开发

```
cd /Users/saqqdy/www/saqqdy/kafka-log-analyzer

# 检查当前状态
git status

# 安装/更新依赖
npm install

# 启动开发模式
npm run dev
```

### 提交代码

```
# 格式化代码
npm run format

# 运行 lint
npm run lint

# 运行测试
npm test

# 构建产物
npm run build

# 提交
git add .
git commit -m "feat: implement analyze_log tool"
git push
```

---

## 🎯 验收 Checklist

### 阶段 1 完成标准

- [ ] 项目结构完整
- [ ] TypeScript 编译成功
- [ ] MCP Server 可启动
- [ ] `/kafka-analyze` 命令可用
- [ ] `analyze_log` Tool 可调用
- [ ] 支持 paste 和 file 输入
- [ ] 输出 Markdown 报告格式正确
- [ ] 单元测试通过
- [ ] 文档完整（README.md）

---

## 🔧 关键文件模板

### package.json

```json
{
  "name": "kafka-log-analyzer",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 📚 参考资源

| 资源 | 路径 |
|------|------|
| Plugin 方案 | [internal/plugin-migration-plan.md](internal/plugin-migration-plan.md) |
| 原 Skill | `/Users/saqqdy/www/saqqdy/skills/skills/kafka-log-analyzer/` |
| Claude Code Plugin 文档 | https://docs.anthropic.com/claude-code/plugins |
| MCP 协议规范 | https://modelcontextprotocol.io/ |
