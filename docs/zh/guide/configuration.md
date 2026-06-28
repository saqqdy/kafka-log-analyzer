# 配置

> Kafka Log Analyzer 配置参考

## 环境变量

### 基础配置

| 变量 | 说明 | 默认值 | 必填 |
|------|------|--------|------|
| `LOG_LEVEL` | 日志级别 | `info` | 否 |
| `NODE_ENV` | 运行环境 | `development` | 否 |

### 数据源配置（Phase 2+）

| 变量 | 说明 | 默认值 | 必填 |
|------|------|--------|------|
| `PROMETHEUS_URL` | Prometheus API 地址 | `http://localhost:9090` | Phase 2+ |
| `KAFKA_EXPORTER_URL` | Kafka Exporter 地址 | `http://localhost:9308` | Phase 2+ |
| `LOKI_URL` | Loki 日志 API 地址 | `http://localhost:3100` | Phase 2+ |
| `SQLITE_PATH` | SQLite 数据库路径 | `./storage/kafka-analyzer.db` | Phase 4+ |

## .env 文件示例

```bash
# .env

# Phase 1 (基础功能) - 无需配置

# Phase 2 (数据源集成)
PROMETHEUS_URL=http://prometheus:9090
KAFKA_EXPORTER_URL=http://kafka-exporter:9308
LOKI_URL=http://loki:3100

# Phase 4 (历史对比)
SQLITE_PATH=./storage/kafka-analyzer.db

# 日志配置
LOG_LEVEL=info
NODE_ENV=production
```

## 配置文件

### plugin.json

Plugin 元数据配置：

```json
{
  "name": "kafka-log-analyzer",
  "version": "0.1.0",
  "description": "Intelligent Kafka log analysis tool for Claude Code",
  "main": "dist/index.js",
  "commands": ["kafka-analyze", "kafka-lag"],
  "mcp": {
    "server": "dist/mcp-server/index.js"
  }
}
```

## Prometheus 配置

### Scrape 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'kafka-exporter'
    static_configs:
      - targets: ['kafka-exporter:9308']
    scrape_interval: 15s
```

### 常用查询

```txt
# Consumer Lag
kafka_consumer_lag_records

# Producer 发送速率
kafka_producer_record_send_rate

# Broker Leader 选主次数
kafka_broker_leader_election_rate

# 按消费组过滤
kafka_consumer_lag_records{group="order-processor"}
```

## Kafka Exporter 配置

### Docker 启动

```bash
docker run -d \
  --name kafka-exporter \
  -p 9308:9308 \
  danielqsj/kafka-exporter \
  --kafka.server=kafka:9092
```

## Loki 配置

### 日志查询

```txt
# Kafka 错误日志
{app="kafka"} |= "ERROR"

# 按时间范围过滤
{app="kafka"} |= "ERROR" [1h]

# Producer 相关错误
{app="kafka", component="producer"} |= "ERROR"
```

## 检测规则配置

可以在 `config/detection-rules.json` 中自定义检测规则：

```json
{
  "rules": [
    {
      "name": "high_lag",
      "condition": "lag > 10000",
      "severity": "P1",
      "recommendation": "Check consumer processing speed"
    },
    {
      "name": "rebalance_storm",
      "condition": "rebalances > 3 in 5m",
      "severity": "P0",
      "recommendation": "Review consumer group configuration"
    }
  ]
}
```

## 相关文档

- [部署指南](/zh/deployment/guide) — 生产部署配置
- [API 参考](/zh/api/mcp-tools) — MCP Tools API 文档