# 命令参考

> Kafka Log Analyzer 命令完整参考

## /kafka-analyze

解析 Kafka 日志，提取事件并检测异常。

### 语法

```bash
/kafka-analyze [options]
```

### 选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--source` | `file` \| `paste` | - | 数据源类型（必填） |
| `--path` | string | - | 日志文件路径（source=file 时必填） |
| `--focus` | string[] | - | 关注点过滤，逗号分隔 |
| `--timeline` | string | - | 时间窗口：`1m`, `5m`, `15m`, `1h`, `6h`, `1d` |
| `--output` | `markdown` \| `json` | `markdown` | 输出格式 |

### 示例

#### 分析日志文件

```bash
/kafka-analyze --source file --path /var/log/kafka/server.log
```

#### 粘贴日志分析

```
/kafka-analyze

[2026-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders
[2026-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)
```

#### 指定关注点

```bash
/kafka-analyze --source file --path server.log --focus producer,error
```

可用的关注点：
- `producer` — Producer 相关事件
- `consumer` — Consumer 相关事件
- `broker` — Broker 相关事件
- `lag` — Consumer Lag 相关
- `error` — 错误和异常

#### 指定时间窗口

```bash
/kafka-analyze --source file --path server.log --timeline 1h
```

#### JSON 输出

```bash
/kafka-analyze --source file --path server.log --output json
```

---

## /kafka-lag

从 Prometheus / Kafka Exporter 获取 Consumer Lag 指标。

> **Phase 2 功能** — 需要配置 Prometheus 数据源

### 语法

```bash
/kafka-lag [options]
```

### 选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `--cluster` | string | 集群名称（可选） |
| `--group` | string | 消费组名称（可选） |
| `--topic` | string | Topic 名称（可选） |

### 示例

#### 查询所有消费组 Lag

```bash
/kafka-lag
```

#### 查询指定集群和消费组

```bash
/kafka-lag --cluster production --group order-processor
```

#### 查询指定 Topic

```bash
/kafka-lag --topic orders
```

---

## MCP Tools

除了斜杠命令，还可以直接调用 MCP Tools。

### analyze_log

```json
{
  "tool": "analyze_log",
  "input": {
    "source": "file",
    "path": "/var/log/kafka/server.log",
    "focus": ["producer", "error"],
    "timeline": "1h"
  }
}
```

### get_lag

```json
{
  "tool": "get_lag",
  "input": {
    "cluster": "production",
    "consumer_group": "order-processor"
  }
}
```

---

## 相关文档

- [配置](/zh/guide/configuration) — 环境变量和数据源配置
- [API 参考](/zh/api/mcp-tools) — 完整 MCP Tools API 文档