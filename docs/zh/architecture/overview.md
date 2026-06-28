# Architecture Overview

> Kafka Log Analyzer 技术架构设计

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Runtime                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   Commands    │  │     Hooks     │  │   Prompts     │      │
│  │               │  │               │  │               │      │
│  │ /kafka-analyze│  │ on_alert      │  │ kafka_diag    │      │
│  │ /kafka-lag    │  │ scheduled     │  │               │      │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘      │
│          │                  │                                   │
│          └──────────────────┼───────────────────────────────────┤
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    MCP Server                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │   Tools     │  │  Resources  │  │  Prompts    │    │  │
│  │  │             │  │             │  │             │    │  │
│  │  │ analyze_log │  │ kafka://    │  │             │    │  │
│  │  │ get_lag     │  │ metrics     │  │             │    │  │
│  │  │ timeline    │  │ history     │  │             │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │         │                                                    │
│  │         ▼                                                    │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Analysis Engine                        │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│  │  │
│  │  │  │ Python      │  │  Anomaly    │  │  Report     ││  │  │
│  │  │  │ Scripts     │  │  Detector   │  │  Generator  ││  │  │
│  │  │  │ (复用现有)   │  │  (7种检测器)│  │             ││  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘│  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Data Layer                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ Prometheus  │  │    Loki     │  │   SQLite    │    │  │
│  │  │ Exporter    │  │   (日志)    │  │  (历史)     │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. MCP Server

MCP Server 是核心组件，负责：

- **Tools**: 提供 `analyze_log`, `get_lag`, `timeline` 等工具
- **Resources**: 提供实时指标和历史数据订阅
- **Prompts**: 提供诊断模板

技术选型：
- TypeScript + `@modelcontextprotocol/sdk`
- Node.js >= 18.0

### 2. Analysis Engine

分析引擎复用现有 Python 脚本：

| 组件 | 功能 | 实现 |
|------|------|------|
| Log Parser | 解析 Kafka 日志 | `scripts/parse_kafka_log.py` |
| Anomaly Detector | 检测异常模式 | `scripts/detect_anomalies.py` |
| Report Generator | 生成诊断报告 | `scripts/generate_report.py` |

集成方式：
```typescript
// src/analysis/parser.ts
import { spawn } from 'child_process';

async function parseLog(content: string) {
  const result = await spawn('python3', [
    'scripts/parse_kafka_log.py',
    '--input', '-'
  ]);
  return JSON.parse(result.stdout);
}
```

### 3. Data Layer

数据层包含三个数据源：

#### Prometheus / Kafka Exporter
- 实时指标查询
- Consumer Lag 监控
- Broker 性能数据

#### Loki
- 日志聚合查询
- LogQL 查询语法
- 时间范围过滤

#### SQLite
- 历史分析记录
- 趋势对比数据
- 基线存储

## 数据流

### 实时分析流

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Kafka       │ ───▶ │ Prometheus  │ ───▶ │ Grafana     │
│ Exporter    │      │             │      │ Alert       │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                                 ▼ 触发 Hook
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Loki / ES   │ ◀─── │ MCP Server  │ ◀─── │ Claude Code │
│ (日志)      │      │             │      │ Plugin      │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │                    ▼                    │
       │            ┌─────────────┐             │
       └───────────▶ │ Analysis    │ ◀───────────┘
                    │ Engine      │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Report      │ ──▶ Markdown / Slack / 飞书
                    └─────────────┘
```

### 命令调用流

```
/kafka-analyze --source file --path server.log
       │
       ▼
┌─────────────┐
│ Command     │ 解析参数
│ Handler     │
└─────────────┘
       │
       ▼ 调用 MCP Tool
┌─────────────┐
│ analyze_log │
│ Tool        │
└─────────────┘
       │
       ▼ 执行分析
┌─────────────┐
│ Python      │ 解析 + 检测
│ Scripts     │
└─────────────┘
       │
       ▼ 返回结果
┌─────────────┐
│ Markdown    │ 格式化输出
│ Formatter   │
└─────────────┘
```

## 分层架构

```
Presentation Layer (展示层)
├── Commands      (/kafka-analyze, /kafka-lag)
├── Prompts       (诊断模板)
└── Output Formats (Markdown, JSON, Slack)

Application Layer (应用层)
├── MCP Server    (Tool 注册和路由)
├── Hooks         (自动触发逻辑)
└── Integrations  (飞书/Slack/JIRA)

Domain Layer (领域层)
├── Analysis Engine (日志解析、异常检测)
├── Comparator      (历史对比)
└── Report Generator (报告生成)

Infrastructure Layer (基础设施层)
├── Data Sources    (Prometheus, Loki, SQLite)
├── Python Scripts  (复用现有脚本)
└── Utilities       (日志、配置、错误处理)
```

## 技术决策

### 为什么复用 Python 脚本？

| 考虑因素 | 重写为 TypeScript | 复用 Python | 决策 |
|---------|-------------------|-------------|------|
| 验证度 | 需要重新验证 | 已经过实际验证 | ✅ 复用 |
| 开发时间 | 2-3 周 | 0 周 | ✅ 复用 |
| 维护成本 | 统一技术栈 | 需维护两套 | ✅ 可接受 |
| 性能 | 可能更快 | 已够用 | ✅ 复用 |

### 为什么选择 SQLite？

| 考虑因素 | PostgreSQL | SQLite | 决策 |
|---------|------------|--------|------|
| 部署复杂度 | 需独立部署 | 零配置 | ✅ SQLite |
| 数据量 | 支持海量 | 适合中小 | ✅ SQLite |
| 查询能力 | 更强大 | 够用 | ✅ SQLite |
| 便携性 | 需迁移 | 单文件 | ✅ SQLite |

## 扩展点

### 1. 新增数据源

在 `src/mcp-server/connectors/` 添加新连接器：

```typescript
// connectors/new-source.ts
export class NewSourceConnector {
  async query(params: QueryParams): Promise<Result> {
    // 实现查询逻辑
  }
}
```

### 2. 新增检测器

在 `scripts/detect_anomalies.py` 添加新检测器：

```python
def detect_new_anomaly(events):
    # 实现检测逻辑
    return anomalies
```

### 3. 新增输出格式

在 `src/utils/report-formatter.ts` 添加新格式：

```typescript
export function formatToNewFormat(result: AnalysisResult): string {
  // 实现格式化逻辑
}
```

## 性能考虑

| 场景 | 目标 | 实现 |
|------|------|------|
| 日志解析 | > 10,000 行/秒 | Python 脚本优化 |
| 分析延迟（1MB） | < 5s | 异步处理 + 缓存 |
| MCP Tool 响应 | < 500ms | 直接调用 + 预加载 |
| Hook 触发延迟 | < 30s | 去重 + 合并窗口 |

## 安全考虑

| 安全项 | 实现 |
|--------|------|
| 输入验证 | TypeScript 类型检查 + schema 验证 |
| API 认证 | 环境变量存储 secrets |
| 日志脱敏 | 不记录敏感数据 |
| 权限控制 | MCP Server 权限配置 |

---

相关文档：
- [API 参考](../api/mcp-tools.md)
- [部署指南](../deployment/guide.md)