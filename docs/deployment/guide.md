# Deployment Guide

> Kafka Log Analyzer deployment and configuration guide

## Table of Contents

- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Data Source Configuration](#data-source-configuration)
- [Monitoring Configuration](#monitoring-configuration)
- [Production Deployment](#production-deployment)

---

## Deployment Methods

### Method 1: Claude Code Plugin (Recommended)

Use directly in Claude Code, no standalone deployment required.

#### Installation Steps

```bash
# Method A: Local Development Install (Recommended)
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
npm install && npm run build

# Load plugin (CLI command, not slash command)
claude --plugin-dir .

# Method B: Install from npm (After Publishing)
claude plugin install kafka-log-analyzer

# Method C: Install from GitHub Marketplace
claude plugin marketplace add https://github.com/saqqdy/kafka-log-analyzer
claude plugin install kafka-log-analyzer
```

#### Verify Installation

```bash
# List installed plugins (CLI command)
claude plugin list
```

#### Usage

```bash
# Invoke directly in Claude Code
/kafka-analyze --source file --path /var/log/kafka/server.log

# Or use MCP Tool
{
  "tool": "analyze_log",
  "input": {
    "source": "paste",
    "content": "..."
  }
}
```

---

### Method 2: Standalone MCP Server

Run as standalone MCP Server for other MCP clients.

#### Build and Start

```bash
# 1. Clone repository
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Configure environment variables
cp .env.example .env

# 5. Start MCP Server
node dist/mcp-server/index.js
```

#### MCP Client Configuration

```json
{
  "mcpServers": {
    "kafka-analyzer": {
      "command": "node",
      "args": ["dist/mcp-server/index.js"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090",
        "KAFKA_EXPORTER_URL": "http://localhost:9308"
      }
    }
  }
}
```

---

### Method 3: PM2 Production Deployment (Optional)

Use PM2 for process management and monitoring.

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kafka-log-analyzer',
    script: 'dist/mcp-server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PROMETHEUS_URL: 'http://prometheus:9090',
      KAFKA_EXPORTER_URL: 'http://kafka-exporter:9308',
      LOG_LEVEL: 'info'
    }
  }]
};
```

#### PM2 Operations

```bash
# Start
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs kafka-log-analyzer

# Restart
pm2 restart kafka-log-analyzer

# Save configuration (auto-start on boot)
pm2 save
pm2 startup
```

---

## Environment Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PROMETHEUS_URL` | Prometheus API URL | `http://localhost:9090` | Phase 2+ |
| `KAFKA_EXPORTER_URL` | Kafka Exporter URL | `http://localhost:9308` | Phase 2+ |
| `LOKI_URL` | Loki log API URL | `http://localhost:3100` | Phase 2+ |
| `SQLITE_PATH` | SQLite database path | `./storage/kafka-analyzer.db` | Phase 4+ |
| `LOG_LEVEL` | Log level | `info` | Optional |
| `NODE_ENV` | Runtime environment | `development` | Optional |

### .env File Example

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

---

## Data Source Configuration

### Prometheus Configuration

#### Prometheus Scrape Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'kafka-exporter'
    static_configs:
      - targets: ['kafka-exporter:9308']
    scrape_interval: 15s
```

#### Common Query Templates

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

### Kafka Exporter Configuration

#### Docker Startup

```bash
docker run -d \
  --name kafka-exporter \
  -p 9308:9308 \
  danielqsj/kafka-exporter \
  --kafka.server=kafka:9092
```

### Loki Configuration

#### Loki Log Query

```txt
# Kafka error logs
{app="kafka"} |= "ERROR"

# Filter by time range
{app="kafka"} |= "ERROR" [1h]

# Producer-related errors
{app="kafka", component="producer"} |= "ERROR"
```

---

## Monitoring Configuration

### Grafana Alert Configuration

```yaml
# alert_rules.yml
groups:
  - name: kafka-alerts
    rules:
      - alert: HighConsumerLag
        expr: kafka_consumer_lag_records > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High consumer lag detected"

      - alert: KafkaErrorRateSpike
        expr: rate(kafka_producer_record_send_rate[5m]) < 0.95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Kafka error rate spike"
```

---

## Production Deployment

### Docker Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  kafka-log-analyzer:
    build: .
    container_name: kafka-log-analyzer
    environment:
      - PROMETHEUS_URL=http://prometheus:9090
      - KAFKA_EXPORTER_URL=http://kafka-exporter:9308
      - LOKI_URL=http://loki:3100
      - LOG_LEVEL=info
    volumes:
      - ./storage:/app/storage
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  kafka-exporter:
    image: danielqsj/kafka-exporter:latest
    command: --kafka.server=kafka:9092
    ports:
      - "9308:9308"

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
```

---

## Troubleshooting

### Common Issues

#### Prometheus Connection Failed

```bash
# Check Prometheus accessibility
curl http://prometheus:9090/api/v1/query?query=up

# Check environment variable
echo $PROMETHEUS_URL
```

#### Log Parsing Failed

```bash
# Check Python environment
python3 --version
python3 scripts/parse_kafka_log.py --help

# Manual test parsing
python3 scripts/parse_kafka_log.py --input tests/fixtures/sample-kafka-log.txt
```

---

Related Documentation:
- [Architecture Overview](../architecture/overview.md)
- [API Reference](../api/mcp-tools.md)
- [Configuration Guide](../guide/configuration.md)