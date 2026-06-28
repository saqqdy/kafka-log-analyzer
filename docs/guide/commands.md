# Command Reference

> Kafka Log Analyzer complete command reference

## /kafka-analyze

Parse Kafka logs, extract events, and detect anomalies.

### Syntax

```bash
/kafka-analyze [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--source` | `file` \| `paste` | - | Data source type (required) |
| `--path` | string | - | Log file path (required when source=file) |
| `--focus` | string[] | - | Focus area filter, comma-separated |
| `--timeline` | string | - | Time window: `1m`, `5m`, `15m`, `1h`, `6h`, `1d` |
| `--output` | `markdown` \| `json` | `markdown` | Output format |

### Examples

#### Analyze Log File

```bash
/kafka-analyze --source file --path /var/log/kafka/server.log
```

#### Paste Log Analysis

```
/kafka-analyze

[2026-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders
[2026-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)
```

#### Specify Focus Areas

```bash
/kafka-analyze --source file --path server.log --focus producer,error
```

Available focus areas:
- `producer` — Producer-related events
- `consumer` — Consumer-related events
- `broker` — Broker-related events
- `lag` — Consumer Lag-related
- `error` — Errors and exceptions

#### Specify Time Window

```bash
/kafka-analyze --source file --path server.log --timeline 1h
```

#### JSON Output

```bash
/kafka-analyze --source file --path server.log --output json
```

---

## /kafka-lag

Get Consumer Lag metrics from Prometheus / Kafka Exporter.

> **Phase 2 Feature** — Requires Prometheus data source configuration

### Syntax

```bash
/kafka-lag [options]
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `--cluster` | string | Cluster name (optional) |
| `--group` | string | Consumer group name (optional) |
| `--topic` | string | Topic name (optional) |

### Examples

#### Query All Consumer Groups Lag

```bash
/kafka-lag
```

#### Query Specific Cluster and Consumer Group

```bash
/kafka-lag --cluster production --group order-processor
```

#### Query Specific Topic

```bash
/kafka-lag --topic orders
```

---

## MCP Tools

In addition to slash commands, you can directly invoke MCP Tools.

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

## Related Documentation

- [Configuration](/guide/configuration) — Environment variables and data source configuration
- [API Reference](/api/mcp-tools) — Complete MCP Tools API documentation