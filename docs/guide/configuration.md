# Configuration

> Kafka Log Analyzer configuration reference

## Environment Variables

### Basic Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Log level | `info` | No |
| `NODE_ENV` | Runtime environment | `development` | No |

### Data Source Configuration (Phase 2+)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PROMETHEUS_URL` | Prometheus API URL | `http://localhost:9090` | Phase 2+ |
| `KAFKA_EXPORTER_URL` | Kafka Exporter URL | `http://localhost:9308` | Phase 2+ |
| `LOKI_URL` | Loki log API URL | `http://localhost:3100` | Phase 2+ |
| `SQLITE_PATH` | SQLite database path | `./storage/kafka-analyzer.db` | Phase 4+ |

## .env File Example

```bash
# .env

# Phase 1 (Basic Features) - No configuration required

# Phase 2 (Data Source Integration)
PROMETHEUS_URL=http://prometheus:9090
KAFKA_EXPORTER_URL=http://kafka-exporter:9308
LOKI_URL=http://loki:3100

# Phase 4 (Historical Comparison)
SQLITE_PATH=./storage/kafka-analyzer.db

# Log Configuration
LOG_LEVEL=info
NODE_ENV=production
```

## Configuration Files

### plugin.json

Plugin metadata configuration:

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

## Prometheus Configuration

### Scrape Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'kafka-exporter'
    static_configs:
      - targets: ['kafka-exporter:9308']
    scrape_interval: 15s
```

### Common Queries

```txt
# Consumer Lag
kafka_consumer_lag_records

# Producer Send Rate
kafka_producer_record_send_rate

# Broker Leader Election Count
kafka_broker_leader_election_rate

# Filter by Consumer Group
kafka_consumer_lag_records{group="order-processor"}
```

## Kafka Exporter Configuration

### Docker Startup

```bash
docker run -d \
  --name kafka-exporter \
  -p 9308:9308 \
  danielqsj/kafka-exporter \
  --kafka.server=kafka:9092
```

## Loki Configuration

### Log Queries

```txt
# Kafka error logs
{app="kafka"} |= "ERROR"

# Filter by time range
{app="kafka"} |= "ERROR" [1h]

# Producer-related errors
{app="kafka", component="producer"} |= "ERROR"
```

## Detection Rule Configuration

You can customize detection rules in `config/detection-rules.json`:

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

## Related Documentation

- [Deployment Guide](/deployment/guide) — Production deployment configuration
- [API Reference](/api/mcp-tools) — MCP Tools API documentation