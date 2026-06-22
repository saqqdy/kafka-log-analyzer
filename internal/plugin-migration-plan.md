# kafka-log-analyzer Plugin 化方案

---

## 一、现状分析

### 当前 Skill 架构

```
skills/kafka-log-analyzer/
├── SKILL.md              # 分析流程 + 诊断知识
├── scripts/
│   ├── parse_kafka_log.py    # 日志解析（支持 --timeline / --watch）
│   ├── detect_anomalies.py   # 异常检测（7 种检测器）
│   └── generate_report.py    # 报告生成
├── references/
│   ├── kafka-patterns.md     # Kafka 模式参考
│   ├── error-codes.md        # 错误码速查
│   └── tuning-guide.md       # 调优指南
└── evals/                    # 评估数据集
```

### 核心能力

| 能力 | 实现方式 |
|------|----------|
| 日志解析 | Python 脚本提取结构化事件 |
| 事件分类 | 11 种事件类型（send_success、send_failure、consumer_lag...） |
| 优先级分级 | P0/P1/P2/P3 规则引擎 |
| 异常检测 | 7 种检测器（error_rate_spike、rebalance_storm...） |
| 源码联动 | Claude 读取项目代码，关联配置和实现 |
| 时间线分析 | `--timeline` 参数，按窗口统计事件分布 |
| 实时监控 | `--watch` 参数，追踪日志文件变化 |

### 局限性

| 维度 | 现状限制 |
|------|----------|
| 数据源 | 依赖用户手动粘贴日志 |
| 触发方式 | 仅手动触发 |
| 实时性 | 轮询脚本，非流式 |
| 状态 | 无持久化，无历史对比 |
| 团队 | 无协作能力 |
| 集成 | 不与告警/CI/工单系统联动 |

---

## 二、Plugin 化价值主张

### 核心升级

```
Skill（现在）              Plugin（升级）
─────────────────────────────────────────────
粘贴日志文本        →      MCP 直连监控 API
手动触发           →      Hook 自动触发（告警/CI）
脚本轮询           →      流式订阅
单次分析           →      历史 + 趋势对比
纯本地             →      推送飞书/Slack/JIRA
```

### 差异化优势

| 能力 | Skill | Plugin | 价值 |
|------|-------|--------|------|
| **实时拉取** | ❌ | ✅ MCP Server 接入 Kafka Exporter / Burrow | 不用等日志文件，直接查指标 |
| **自动触发** | ❌ | ✅ Hook 绑定告警系统 | 问题发生即分析，无需人工介入 |
| **精确参数** | ❌ | ✅ `/kafka-analyze --focus lag --timeline 1h` | 命令化交互，减少描述歧义 |
| **历史对比** | ❌ | ✅ 持久化 + 趋势 | "这次比上周同类错误多 3 倍" |
| **团队协作** | ❌ | ✅ 推送 + 工单关联 | 分析结果直达 On-call |

---

## 三、MCP Server 设计

### 数据源优先级

```
第一优先级（直接指标）
├── Kafka Exporter（Prometheus 指标）
│   ├── kafka_consumer_lag_records
│   ├── kafka_producer_record_send_rate
│   └── kafka_broker_leader_election_rate
│
├── Burrow（Consumer Lag 监控）
│   ├── /v3/kafka/{cluster}/consumer/{group}/lag
│   └── /v3/kafka/{cluster}/consumer/{group}/status
│
└── Confluent Control Center（商业方案）
    └── /2.0/kafka/{cluster}/topics/{topic}/consumers

第二优先级（日志采集）
├── Elasticsearch / OpenSearch（Kafka 日志索引）
├── Loki（日志聚合）
└── 本地日志文件（现有能力保留）

第三优先级（业务系统）
├── Grafana（看板数据）
└── PagerDuty / 告警平台（事件触发）
```

### MCP Server 架构

```
┌─────────────────────────────────────────────────────────┐
│                    kafka-log-analyzer                   │
│                       MCP Server                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Resources   │  │ Tools       │  │ Prompts     │    │
│  │             │  │             │  │             │    │
│  │ kafka://    │  │ analyze_log │  │ kafka_diag  │    │
│  │ metrics     │  │ get_lag     │  │             │    │
│  │             │  │ timeline    │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │                │                │          │
│         └────────────────┼────────────────┘          │
│                          ▼                             │
│              ┌──────────────────────┐                 │
│              │   Analysis Engine    │                 │
│              │   (复用现有脚本)      │                 │
│              └──────────────────────┘                 │
│                          │                             │
│         ┌────────────────┼────────────────┐          │
│         ▼                ▼                ▼          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Kafka       │  │ Prometheus  │  │ Local       │   │
│  │ Exporter    │  │ / Loki      │  │ Log Files   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MCP Tools 定义

```typescript
// 1. 分析日志
{
  name: "analyze_log",
  description: "解析 Kafka 日志，提取事件并检测异常",
  inputSchema: {
    type: "object",
    properties: {
      source: { type: "string", enum: ["paste", "file", "elasticsearch", "loki"] },
      content: { type: "string", description: "日志内容（source=paste 时）" },
      path: { type: "string", description: "文件路径（source=file 时）" },
      query: { type: "string", description: "ES/Loki 查询（source=elasticsearch/loki 时）" },
      focus: { type: "array", items: { enum: ["producer", "consumer", "broker", "lag", "error"] } },
      timeline: { type: "string", enum: ["1m", "5m", "15m", "1h", "6h", "1d"] },
      priority: { type: "array", items: { enum: ["P0", "P1", "P2", "P3"] } }
    },
    required: ["source"]
  }
}

// 2. 获取消费积压
{
  name: "get_lag",
  description: "从 Kafka Exporter/Burrow 获取 Consumer Lag 指标",
  inputSchema: {
    type: "object",
    properties: {
      cluster: { type: "string" },
      consumer_group: { type: "string" },
      topic: { type: "string" }
    }
  }
}

// 3. 时间线分析
{
  name: "timeline",
  description: "按时间窗口统计事件分布",
  inputSchema: {
    type: "object",
    properties: {
      events: { type: "array", items: { type: "object" } },
      window: { type: "string", enum: ["1m", "5m", "15m", "1h", "6h", "1d"] }
    },
    required: ["events"]
  }
}

// 4. 源码关联
{
  name: "link_source",
  description: "根据日志中的线程名/异常类，定位项目源码",
  inputSchema: {
    type: "object",
    properties: {
      thread: { type: "string" },
      exception: { type: "string" },
      topic: { type: "string" }
    }
  }
}

// 5. 生成报告
{
  name: "generate_report",
  description: "生成 Markdown 诊断报告",
  inputSchema: {
    type: "object",
    properties: {
      events: { type: "array" },
      anomalies: { type: "array" },
      format: { type: "string", enum: ["markdown", "json", "slack"] }
    }
  }
}
```

### MCP Resources 定义

```typescript
// 1. 实时指标流
{
  uri: "kafka://metrics/{cluster}/lag",
  name: "Consumer Lag Metrics",
  mimeType: "application/json"
}

// 2. 历史分析记录
{
  uri: "kafka://history/{cluster}",
  name: "Historical Analysis",
  mimeType: "application/json"
}

// 3. 基线数据
{
  uri: "kafka://baseline/{cluster}",
  name: "Baseline Metrics",
  mimeType: "application/json"
}
```

---

## 四、命令设计

### 主命令

```bash
/kafka-analyze [options]

选项：
  --source <type>       数据源：paste | file | exporter | burrow (默认: paste)
  --focus <areas>       关注点：producer,consumer,broker,lag,error (逗号分隔)
  --priority <levels>   优先级过滤：P0,P1,P2,P3 (默认: P0,P1)
  --timeline <window>   时间线窗口：1m,5m,15m,1h,6h,1d
  --watch               实时监控模式
  --report <format>     报告格式：markdown | json | slack
```

### 子命令

```bash
# 快速诊断
/kafka-diagnose <paste-log-content>

# 消费积压
/kafka-lag [--cluster <name>] [--group <consumer-group>]

# 时间线
/kafka-timeline <log-content> --window 1h

# 源码联动
/kafka-link-source <log-content>

# 实时监控
/kafka-watch <log-file>
```

### 自然语言触发（保留 Skill 能力）

```
分析这段 Kafka 日志，重点关注消费积压和 Rebalance 问题：
[日志内容...]

输出最近 24h 所有 P0/P1 Kafka 错误的诊断报告

这段日志显示 Producer 频繁超时，请搜索项目中的 Kafka 配置给出修复方案：
[日志内容...]
```

---

## 五、Hook 设计

### 自动触发场景

| Hook | 触发条件 | 动作 |
|------|----------|------|
| `on_pagerduty_alert` | PagerDuty 事件包含 "kafka" 关键词 | 自动拉取对应时间段日志，生成诊断报告 |
| `on_ci_failure` | CI 日志包含 Kafka 异常类 | 调用 `/kafka-analyze` 分析 CI 日志片段 |
| `on_grafana_alert` | Grafana 告警（lag > 阈值） | 拉取 Prometheus 指标 + 近 1h 日志，生成报告 |
| `scheduled_check` | 定时任务（如每小时） | 检查关键指标，异常时主动推送 |

### Hook 配置示例

```json
{
  "hooks": {
    "on_pagerduty_alert": {
      "condition": "event.message contains 'kafka'",
      "action": "/kafka-analyze --source loki --query 'service=kafka AND level=ERROR' --timeline 1h --report slack"
    },
    "on_grafana_alert": {
      "condition": "alert.name contains 'kafka' and alert.state = 'firing'",
      "action": "/kafka-lag --cluster ${alert.labels.cluster} && /kafka-analyze --source exporter --focus lag --timeline 15m"
    }
  }
}
```

---

## 六、数据流设计

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

### 历史对比流

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ 本次分析    │      │ 历史记录    │      │ 基线数据    │
│ (events)    │      │ (SQLite)    │      │ (baseline)  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                     ┌─────────────┐
                     │ 趋势对比    │
                     │ - 同比      │
                     │ - 环比      │
                     │ - 异常倍数  │
                     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ 增强报告    │
                     │ "这次比上周 │
                     │  同类错误多 │
                     │  3 倍"      │
                     └─────────────┘
```

---

## 七、分阶段实施路线

### 阶段 1：Plugin 骨架（1-2 天）

**目标**：搭建 Claude Code Plugin 结构，迁移现有 Skill 能力

```
kafka-log-analyzer/
├── plugin.json           # Plugin manifest
├── commands/
│   └── kafka-analyze.ts  # 主命令
├── mcp-server/
│   ├── index.ts          # MCP Server 入口
│   └── tools/
│       └── analyze_log.ts
├── scripts/              # 复用现有 Python 脚本
└── references/           # 复用现有参考文档
```

**交付物**：
- `/kafka-analyze` 命令可用
- 复用现有分析逻辑
- 支持 paste / file 两种 source

---

### 阶段 2：MCP 数据源（3-5 天）

**目标**：接入 Kafka Exporter + Prometheus

```
mcp-server/
├── connectors/
│   ├── prometheus.ts    # Prometheus 查询
│   ├── exporter.ts      # Kafka Exporter 指标
│   └── burrow.ts        # Burrow API
└── tools/
    ├── get_lag.ts
    └── analyze_metrics.ts
```

**交付物**：
- `get_lag` tool 可用
- `analyze_log` 支持 `source: "exporter"`
- MCP Resources：实时指标流

---

### 阶段 3：Hook 集成（2-3 天）

**目标**：自动触发 + 推送

```
hooks/
├── on_pagerduty_alert.ts
├── on_grafana_alert.ts
└── scheduled_check.ts

integrations/
├── slack.ts
├── feishu.ts
└── jira.ts
```

**交付物**：
- Grafana 告警触发自动分析
- 分析结果推送飞书/Slack
- 关联 JIRA 工单

---

### 阶段 4：历史对比（2-3 天）

**目标**：持久化 + 趋势分析

```
storage/
├── sqlite.ts            # 历史记录存储
└── baseline.ts          # 基线管理

tools/
└── compare_history.ts   # 历史对比
```

**交付物**：
- 分析结果持久化
- 历史趋势对比
- 异常倍数检测

---

### 阶段 5：用户体验优化（持续）

**目标**：打磨交互体验

- 命令参数自动补全
- 交互式报告（折叠/展开）
- 可视化时间线（ASCII chart）
- 快捷诊断模板

---

## 八、技术选型

| 组件 | 技术栈 | 理由 |
|------|--------|------|
| MCP Server | TypeScript + @anthropic-ai/sdk | Claude Code 原生支持 |
| 数据源连接 | axios + prom-client | 轻量级 HTTP 客户端 |
| 指标解析 | 复用现有 Python 脚本 | 已验证，避免重写 |
| 持久化 | SQLite (better-sqlite3) | 零配置，单文件 |
| 推送集成 | Slack SDK / 飞书开放平台 API | 标准化 SDK |

---

## 九、配置示例

### plugin.json

```json
{
  "name": "kafka-log-analyzer",
  "version": "1.0.0",
  "description": "Kafka 日志智能分析，支持实时监控、异常检测、源码联动",
  "author": "saqqdy",
  "mcpServers": {
    "kafka-analyzer": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090",
        "KAFKA_EXPORTER_URL": "http://localhost:9308",
        "BURROW_URL": "http://localhost:8000"
      }
    }
  },
  "commands": {
    "kafka-analyze": {
      "description": "分析 Kafka 日志",
      "handler": "commands/kafka-analyze.ts"
    },
    "kafka-lag": {
      "description": "获取消费积压指标",
      "handler": "commands/kafka-lag.ts"
    }
  },
  "hooks": {
    "on_grafana_alert": {
      "condition": "alert.name contains 'kafka'",
      "handler": "hooks/on_grafana_alert.ts"
    }
  }
}
```

---

## 十、验收标准

### 阶段 1

- [ ] `/kafka-analyze` 命令可用
- [ ] 支持 paste / file 两种输入
- [ ] 输出 Markdown 诊断报告
- [ ] 优先级分级正确（P0-P3）
- [ ] 异常检测准确率 > 90%（基于 evals）

### 阶段 2

- [ ] `get_lag` tool 可用
- [ ] 支持 Prometheus 数据源
- [ ] MCP Resources 可订阅
- [ ] 实时指标延迟 < 5s

### 阶段 3

- [ ] Grafana 告警触发分析
- [ ] 分析结果推送飞书/Slack
- [ ] Hook 延迟 < 30s

### 阶段 4

- [ ] 历史数据持久化
- [ ] 趋势对比报告可用
- [ ] 异常倍数检测准确

---

## 十一、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Prometheus 连接不稳定 | 实时指标不可用 | 降级到 Loki 日志查询 |
| 日志格式变化 | 解析失败 | 支持 JSON 格式优先，纯文本兜底 |
| Hook 触发风暴 | 分析排队 | 添加去重 + 合并窗口 |
| 历史数据膨胀 | SQLite 性能下降 | 定期清理 + 只保留 P0/P1 |

---

## 十二、后续扩展方向

1. **AI 根因预测**：基于历史数据，预测即将发生的异常
2. **自动修复建议**：不仅诊断，还生成可执行的修复 PR
3. **多集群视图**：同时分析多个 Kafka 集群，对比差异
4. **成本优化**：分析 Kafka 资源使用，给出降本建议
5. **消息血缘**：追踪消息从生产到消费的完整路径
