# 🔍 Kafka Log Analyzer

> AI 驱动的 Kafka 日志分析，支持实时监控、异常检测、源码联动 — 用 Claude Code 智能诊断 Kafka 问题。

[![npm version](https://img.shields.io/npm/v/kafka-log-analyzer.svg)](https://www.npmjs.com/package/kafka-log-analyzer)
[![license](https://img.shields.io/npm/l/kafka-log-analyzer.svg)](https://github.com/saqqdy/kafka-log-analyzer/blob/main/LICENSE)

[English Documentation](README.md)

---

## 🎯 解决什么问题？

| 场景 | 传统调试方式 | Kafka Log Analyzer |
|------|------------|-------------------|
| 日志分析 | 手动 grep 几千行日志 | AI 提取事件、检测异常、优先级排序 |
| 消费积压 | 检查多个仪表盘 | 单个命令显示所有消费者组的积压情况 |
| 错误诊断 | 手动关联日志和源代码 | AI 将错误关联到配置和实现代码 |
| 故障响应 | 复制粘贴日志到 Slack/飞书 | 自动生成格式化报告，可直接分享 |

**核心洞察**：Kafka 故障排查需要理解日志语义，而非仅仅关键词匹配。

---

## ✨ 核心特性

### 📊 智能日志分析

- **多格式支持**：解析文本和 JSON 格式的 Kafka 日志
- **11 种事件类型**：发送成功、发送失败、消费积压、Rebalance、提交失败、缓冲耗尽、Leader 变更、Offset 越界、序列化错误、网络错误、认证错误
- **异常检测**：7 种内置检测器，检测错误率突增、Rebalance 风暴、积压激增、Leader 不稳定、副本延迟、序列化问题、网络问题

### 🎯 优先级分级

自动严重程度分级 (P0-P3)：

| 优先级 | 严重程度 | 示例 |
|--------|----------|------|
| P0 (严重) | critical | 集群宕机、数据丢失风险 |
| P1 (高) | high | 消费积压 > 10K、频繁 Rebalance |
| P2 (中) | medium | Leader 变更、瞬时错误 |
| P3 (低) | low | 警告、信息性事件 |

### 🔄 多种输出格式

- **Markdown**：带章节和推荐的详细报告
- **JSON**：结构化数据，便于程序化处理
- **Slack**：为团队频道优化的紧凑格式

### 🖥️ Claude Code 集成

- **MCP Tools**：从 Claude Code 或任何 MCP 客户端调用分析
- **斜杠命令**：`/kafka-analyze` 快速分析
- **源码联动**：AI 将错误关联到你的 Kafka 配置

---

## 🚀 快速开始

### 安装

#### 方式 1：本地开发安装（推荐）

```bash
# 克隆并构建
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
npm install
npm run build

# 在 Claude Code 中加载插件（终端命令，不是斜杠命令）
claude --plugin-dir .
```

#### 方式 2：从 npm 安装（发布后）

```bash
# 发布到 npm 后
claude plugin install kafka-log-analyzer
```

#### 方式 3：添加 GitHub 仓库作为插件市场源

```bash
# 将 GitHub 仓库添加为插件市场源
claude plugin marketplace add https://github.com/saqqdy/kafka-log-analyzer

# 然后从该市场安装插件
claude plugin install kafka-log-analyzer
```

> ⚠️ 方式 3 要求仓库包含有效的 `marketplace.json` 清单文件。对大多数用户来说，方式 1 或 2 更简单。

### ⚡ 安装后验证

```bash
# 查看已安装的插件（CLI 命令，不是斜杠命令）
claude plugin list

# 应该看到 kafka-log-analyzer 在列表中
```

### 🎯 快速使用

安装成功后，直接在 Claude Code 中调用：

```bash
# 使用斜杠命令分析日志文件
/kafka-analyze --source file --path /var/log/kafka/server.log

# 或粘贴日志内容分析
/kafka-analyze --source paste <<EOF
[2024-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders
[2024-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)
EOF

# 使用 MCP Tool（从 Claude Code 或 MCP 客户端）
{
  "tool": "analyze_log",
  "input": {
    "source": "paste",
    "content": "..."
  }
}
```

### ⚡ 30秒快速体验核心功能

使用内置测试数据快速体验所有功能：

```bash
# 1. 基础分析 - Markdown 报告
node dist/commands/kafka-analyze.js \
  --source file \
  --path tests/fixtures/sample-kafka-log.txt \
  --report markdown

# 2. 按优先级过滤 - 只看严重错误
node dist/commands/kafka-analyze.js \
  --source file \
  --path tests/fixtures/sample-kafka-log.txt \
  --priority P0,P1

# 3. 按组件聚焦 - 只看 Producer 问题
node dist/commands/kafka-analyze.js \
  --source file \
  --path tests/fixtures/sample-kafka-log.txt \
  --focus producer

# 4. 时间线分析 - 查看事件分布
node dist/commands/kafka-analyze.js \
  --source file \
  --path tests/fixtures/sample-kafka-log.txt \
  --timeline 1m \
  --report json

# 5. Slack 格式 - 生成分享报告
node dist/commands/kafka-analyze.js \
  --source file \
  --path tests/fixtures/sample-kafka-log.txt \
  --report slack
```

**预期结果：**
- 检测到 6 个错误事件（Producer 超时、Consumer Lag、Rebalance 等）
- 发现异常：`error_rate_spike`（错误率突增）、`rebalance_storm`（频繁 Rebalance）
- 生成结构化诊断报告

### 📊 基础用法

#### 1. 分析日志文件

```bash
# 分析 Kafka 日志文件
node dist/commands/kafka-analyze.js --source file --path /var/log/kafka/server.log

# 带时间线分析
node dist/commands/kafka-analyze.js --source file --path server.log --timeline 1h

# 关注特定领域
node dist/commands/kafka-analyze.js --source file --path server.log --focus producer,consumer
```

#### 2. 分析粘贴的日志

```bash
# 通过 stdin 粘贴日志
cat kafka-error.log | node dist/commands/kafka-analyze.js --source paste

# 或使用 heredoc
node dist/commands/kafka-analyze.js --source paste <<EOF
[2024-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders
[2024-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)
EOF
```

#### 3. 在 Claude Code 中使用 MCP Tools

```typescript
// 在 Claude Code 中调用 analyze_log 工具
{
  "source": "paste",
  "content": "[2024-01-15 10:00:01] ERROR [producer] Failed to send record...",
  "focus": ["producer", "error"],
  "timeline": "1h"
}
```

#### 4. Python 脚本独立验证

```bash
# 日志解析
python3 scripts/parse_kafka_log.py --input tests/fixtures/sample-kafka-log.txt

# 异常检测
python3 scripts/detect_anomalies.py --input tests/fixtures/sample-kafka-log.txt

# 报告生成
python3 scripts/generate_report.py --input tests/fixtures/sample-kafka-log.txt --format markdown
```

### 🎯 功能矩阵

| 功能 | 命令参数 | 说明 |
|------|---------|------|
| **日志解析** | `--source file --path xxx.log` | 支持 paste/file 两种输入 |
| **错误过滤** | `--priority P0,P1` | 4 级优先级过滤（P0-P3） |
| **组件聚焦** | `--focus producer,consumer` | 按组件精准分析 |
| **时间线分析** | `--timeline 1m` | 事件时间分布统计 |
| **多种输出** | `--report markdown|json|slack` | 3 种输出格式 |
| **异常检测** | 自动检测 | 7 种异常模式（错误率突增、Rebalance风暴等） |

---

## 📖 使用示例

### 示例 1：诊断生产者失败

```bash
# 分析最近一小时的生产者错误
node dist/commands/kafka-analyze.js \
  --source file \
  --path /var/log/kafka/producer.log \
  --focus producer,error \
  --timeline 1h \
  --priority P0,P1 \
  --report markdown
```

**输出：**

```markdown
# Kafka Log Analysis Report

**Total Events**: 847

## Priority Summary
- **P0 (Critical)**: 3
- **P1 (High)**: 12
- **P2 (Medium)**: 45
- **P3 (Low)**: 128

## Detected Anomalies

### 🔴 send_failure_spike (P0)
**Component**: producer
**Description**: Error rate 15% exceeds threshold (5%)
**Recommendation**: Check broker availability and network connectivity

### 🟠 buffer_exhausted (P1)
**Component**: producer
**Description**: Buffer exhausted 23 times
**Recommendation**: Increase buffer.memory or batch.size
```

### 示例 2：监控消费积压

```bash
# 检查消费积压，Slack 优化的输出
node dist/commands/kafka-analyze.js \
  --source file \
  --path /var/log/kafka/consumer.log \
  --focus consumer,lag \
  --report slack
```

**输出：**

```
📊 **Kafka Log Analysis**
Total: 1234 | P0: 2 | P1: 8

⚠️ **Anomalies**:
• P1: consumer_lag - Consumer group order-processor lag: 15,000 messages
• P2: rebalance_storm - 12 rebalances in last hour
```

### 示例 3：时间线分析

```bash
# 生成逐分钟事件分布
node dist/commands/kafka-analyze.js \
  --source file \
  --path server.log \
  --timeline 1m \
  --report json | jq '.timeline'
```

---

## 🛠️ 命令参考

### `/kafka-analyze` 命令

```bash
/kafka-analyze [options]

选项:
  --source <type>       日志来源: paste | file (默认: paste)
  --path <file>         日志文件路径 (source=file 时必需)
  --focus <areas>       关注领域: producer,consumer,broker,lag,error
  --timeline <window>   时间窗口: 1m,5m,15m,1h,6h,1d
  --priority <levels>   按优先级过滤: P0,P1,P2,P3 (默认: P0,P1)
  --report <format>     输出格式: markdown | json | slack (默认: markdown)
```

### MCP Tools

#### `analyze_log`

分析 Kafka 日志并返回结构化结果。

**输入 Schema:**

```json
{
  "source": "paste" | "file",
  "content": "string (当 source=paste)",
  "path": "string (当 source=file)",
  "focus": ["producer", "consumer", "broker", "lag", "error"],
  "timeline": "1m" | "5m" | "15m" | "1h" | "6h" | "1d"
}
```

**输出:**

```json
{
  "events": [
    {
      "timestamp": "2024-01-15 10:00:01",
      "level": "ERROR",
      "component": "producer",
      "message": "Failed to send record..."
    }
  ],
  "anomalies": [
    {
      "type": "error_rate_spike",
      "severity": "P1",
      "component": "producer",
      "description": "Error rate 15% exceeds threshold",
      "recommendation": "Check broker availability..."
    }
  ],
  "summary": {
    "total": 847,
    "byPriority": { "P0": 3, "P1": 12, "P2": 45, "P3": 128 }
  }
}
```

#### `get_lag` (阶段 2)

从 Prometheus/Kafka Exporter 查询消费积压。

---

## 📁 项目结构

```
kafka-log-analyzer/
├── .claude-plugin/
│   └── plugin.json        # 插件清单（必需）
├── marketplace.json       # 市场源定义
├── src/
│   ├── commands/           # CLI 命令
│   │   └── kafka-analyze.ts
│   ├── mcp-server/         # MCP Server 实现
│   │   ├── index.ts
│   │   └── tools/
│   │       ├── analyze_log.ts
│   │       └── get_lag.ts
│   ├── hooks/              # Hook 处理器 (阶段3)
│   ├── integrations/       # 飞书/Slack/JIRA (阶段3)
│   ├── storage/            # SQLite 持久化 (阶段4)
│   └── utils/              # 工具函数
├── scripts/                # Python 分析脚本
│   ├── parse_kafka_log.py
│   ├── detect_anomalies.py
│   └── generate_report.py
├── references/             # Kafka 参考文档
│   ├── kafka-patterns.md
│   ├── error-codes.md
│   └── tuning-guide.md
└── tests/                  # 测试套件
```

---

## 🔧 配置

从模板创建 `.env` 文件：

```bash
cp .env.example .env
```

**环境变量:**

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `PROMETHEUS_URL` | Prometheus 端点 (阶段2) | `http://localhost:9090` |
| `KAFKA_EXPORTER_URL` | Kafka Exporter 端点 (阶段2) | `http://localhost:9308` |
| `LOKI_URL` | Loki 日志端点 (阶段2) | `http://localhost:3100` |
| `SQLITE_PATH` | SQLite 数据库路径 | `./storage/kafka-analyzer.db` |
| `LOG_LEVEL` | 日志级别 | `info` |

---

## 🗺️ 开发路线

| 版本 | 里程碑 | 功能 |
|------|--------|------|
| **v0.1.0** | Alpha | Plugin 骨架 + 基础分析能力 |
| **v0.2.0** | Alpha | 增强命令 + 参数化控制 |
| **v0.3.0** | Beta | Prometheus + Kafka Exporter 集成 |
| **v0.4.0** | Beta | Grafana 告警 + 飞书/Slack/JIRA 推送 |
| **v0.5.0** | RC | 历史趋势 + 基线对比 |
| **v1.0.0** | GA | 生产就绪正式发布 |

---

## 🤝 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)。

```bash
# 开发
npm install
npm run dev          # 监听模式
npm test             # 运行测试
npm run lint         # Lint 检查
npm run format       # 格式化代码
npm run build        # 构建
```

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [架构设计](docs/architecture/overview.md) | 技术架构和数据流 |
| [API 参考](docs/api/mcp-tools.md) | MCP Tools 完整 API |
| [部署指南](docs/deployment/guide.md) | 多种部署方式 |
| [贡献指南](CONTRIBUTING.md) | 开发规范和 PR 流程 |
| [变更日志](CHANGELOG.md) | 版本变更记录 |

---

## 📄 许可证

MIT © [saqqdy](https://github.com/saqqdy)

---

## 🔗 资源

- [Kafka 官方文档](https://kafka.apache.org/documentation/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Claude Code Plugin 文档](https://docs.anthropic.com/claude-code/plugins)