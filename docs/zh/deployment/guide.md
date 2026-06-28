# Deployment Guide

> Kafka Log Analyzer 部署和配置指南

## 目录

- [部署方式](#部署方式)
- [环境配置](#环境配置)
- [数据源配置](#数据源配置)
- [监控配置](#监控配置)
- [生产部署](#生产部署)

---

## 部署方式

### 方式 1：Claude Code Plugin（推荐）

直接在 Claude Code 中使用，无需独立部署。

#### 安装步骤

```bash
# 方式 A：本地开发安装（推荐）
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
npm install && npm run build

# 加载插件（CLI 命令，不是斜杠命令）
claude --plugin-dir .

# 方式 B：从 npm 安装（发布后）
claude plugin install kafka-log-analyzer

# 方式 C：从 GitHub 市场安装
claude plugin marketplace add https://github.com/saqqdy/kafka-log-analyzer
claude plugin install kafka-log-analyzer
```

#### 验证安装

```bash
# 查看已安装插件（CLI 命令）
claude plugin list
```

#### 使用方式

```bash
# 在 Claude Code 中直接调用
/kafka-analyze --source file --path /var/log/kafka/server.log

# 或使用 MCP Tool
{
  "tool": "analyze_log",
  "input": {
    "source": "paste",
    "content": "..."
  }
}
```

---

### 方式 2：独立 MCP Server

作为独立 MCP Server 运行，供其他 MCP 客户端使用。

#### 构建和启动

```bash
# 1. 克隆仓库
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 配置环境变量
cp .env.example .env

# 5. 启动 MCP Server
node dist/mcp-server/index.js
```

#### MCP 客户端配置

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

### 方式 3：PM2 生产部署（可选）

使用 PM2 进行进程管理和监控。

#### PM2 配置

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

#### PM2 操作

```bash
# 启动
pm2 start ecosystem.config.js

# 监控
pm2 monit

# 日志
pm2 logs kafka-log-analyzer

# 重启
pm2 restart kafka-log-analyzer

# 保存配置（开机自启）
pm2 save
pm2 startup
```

---

## 环境配置

### 环境变量说明

| 变量 | 说明 | 默认值 | 必填 |
|------|------|--------|------|
| `PROMETHEUS_URL` | Prometheus API 地址 | `http://localhost:9090` | Phase 2+ |
| `KAFKA_EXPORTER_URL` | Kafka Exporter 地址 | `http://localhost:9308` | Phase 2+ |
| `LOKI_URL` | Loki 日志 API 地址 | `http://localhost:3100` | Phase 2+ |
| `SQLITE_PATH` | SQLite 数据库路径 | `./storage/kafka-analyzer.db` | Phase 4+ |
| `LOG_LEVEL` | 日志级别 | `info` | 可选 |
| `NODE_ENV` | 运行环境 | `development` | 可选 |

### .env 文件示例

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

---

## 数据源配置

### Prometheus 配置

#### Prometheus scrape 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'kafka-exporter'
    static_configs:
      - targets: ['kafka-exporter:9308']
    scrape_interval: 15s
```

#### 常用查询模板

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

### Kafka Exporter 配置

#### Docker 启动

```bash
docker run -d \
  --name kafka-exporter \
  -p 9308:9308 \
  danielqsj/kafka-exporter \
  --kafka.server=kafka:9092
```

### Loki 配置

#### Loki 日志查询

```txt
# Kafka 错误日志
{app="kafka"} |= "ERROR"

# 按时间范围过滤
{app="kafka"} |= "ERROR" [1h]

# Producer 相关错误
{app="kafka", component="producer"} |= "ERROR"
```

---

## 监控配置

### Grafana Alert 配置

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

## 生产部署

### Docker 部署

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

## 故障排查

### 常见问题

#### Prometheus 连接失败

```bash
# 检查 Prometheus 可达性
curl http://prometheus:9090/api/v1/query?query=up

# 检查环境变量
echo $PROMETHEUS_URL
```

#### 日志解析失败

```bash
# 检查 Python 环境
python3 --version
python3 scripts/parse_kafka_log.py --help

# 手动测试解析
python3 scripts/parse_kafka_log.py --input tests/fixtures/sample-kafka-log.txt
```

---

相关文档：
- [架构概览](../architecture/overview.md)
- [API 参考](../api/mcp-tools.md)
- [配置指南](../guide/configuration.md)