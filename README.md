# 🔍 Kafka Log Analyzer

> AI-powered Kafka log analysis with real-time monitoring, anomaly detection, and source code integration — intelligently diagnose Kafka issues with Claude Code.

[![npm version](https://img.shields.io/npm/v/kafka-log-analyzer.svg)](https://www.npmjs.com/package/kafka-log-analyzer)
[![license](https://img.shields.io/npm/l/kafka-log-analyzer.svg)](https://github.com/saqqdy/kafka-log-analyzer/blob/main/LICENSE)

[中文文档](README_CN.md)

---

## 🎯 The Problem It Solves

| Scenario | Traditional Debugging | Kafka Log Analyzer |
|----------|----------------------|-------------------|
| Log Analysis | Manually grep thousands of lines | AI extracts events, detects anomalies, prioritizes issues |
| Consumer Lag | Check multiple dashboards | Single command shows lag across all consumer groups |
| Error Diagnosis | Correlate logs with source code manually | AI links errors to configuration and implementation |
| Incident Response | Copy-paste logs to Slack/Feishu | Auto-generate formatted reports ready to share |

**Core insight**: Kafka troubleshooting requires understanding log semantics, not just keyword matching.

---

## ✨ Core Features

### 📊 Intelligent Log Analysis

- **Multi-format Support**: Parse both text and JSON Kafka logs
- **11 Event Types**: send_success, send_failure, consumer_lag, rebalance, commit_failure, buffer_exhausted, leader_change, offset_out_of_range, serialization_error, network_error, auth_error
- **Anomaly Detection**: 7 built-in detectors for error spikes, rebalance storms, lag spikes, leader instability, replica lag, serialization issues, network problems

### 🎯 Priority Classification

Automatic severity grading (P0-P3):

| Priority | Severity | Examples |
|----------|----------|----------|
| P0 (Critical) | critical | Cluster down, data loss risk |
| P1 (High) | high | Consumer lag > 10K, frequent rebalances |
| P2 (Medium) | medium | Leader changes, transient errors |
| P3 (Low) | low | Warnings, informational events |

### 🔄 Multiple Output Formats

- **Markdown**: Detailed report with sections and recommendations
- **JSON**: Structured data for programmatic processing
- **Slack**: Compact format optimized for team channels

### 🖥️ Claude Code Integration

- **MCP Tools**: Call analysis from Claude Code or any MCP client
- **Slash Commands**: `/kafka-analyze` for quick analysis
- **Source Code Linking**: AI correlates errors with your Kafka configuration

---

## 🚀 Quick Start

### Installation

```bash
npm install kafka-log-analyzer

# Or clone for development
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
npm install
npm run build
```

### Basic Usage

#### 1. Analyze Logs from File

```bash
# Analyze a Kafka log file
node dist/commands/kafka-analyze.js --source file --path /var/log/kafka/server.log

# With timeline analysis
node dist/commands/kafka-analyze.js --source file --path server.log --timeline 1h

# Focus on specific areas
node dist/commands/kafka-analyze.js --source file --path server.log --focus producer,consumer
```

#### 2. Analyze Pasted Logs

```bash
# Paste logs via stdin
cat kafka-error.log | node dist/commands/kafka-analyze.js --source paste

# Or use heredoc
node dist/commands/kafka-analyze.js --source paste <<EOF
[2024-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders
[2024-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)
EOF
```

#### 3. Use MCP Tools in Claude Code

```typescript
// In Claude Code, call the analyze_log tool
{
  "source": "paste",
  "content": "[2024-01-15 10:00:01] ERROR [producer] Failed to send record...",
  "focus": ["producer", "error"],
  "timeline": "1h"
}
```

---

## 📖 Usage Examples

### Example 1: Diagnose Producer Failures

```bash
# Analyze producer errors from the last hour
node dist/commands/kafka-analyze.js \
  --source file \
  --path /var/log/kafka/producer.log \
  --focus producer,error \
  --timeline 1h \
  --priority P0,P1 \
  --report markdown
```

**Output:**

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

### Example 2: Monitor Consumer Lag

```bash
# Check consumer lag with Slack-optimized output
node dist/commands/kafka-analyze.js \
  --source file \
  --path /var/log/kafka/consumer.log \
  --focus consumer,lag \
  --report slack
```

**Output:**

```
📊 **Kafka Log Analysis**
Total: 1234 | P0: 2 | P1: 8

⚠️ **Anomalies**:
• P1: consumer_lag - Consumer group order-processor lag: 15,000 messages
• P2: rebalance_storm - 12 rebalances in last hour
```

### Example 3: Timeline Analysis

```bash
# Generate minute-by-minute event distribution
node dist/commands/kafka-analyze.js \
  --source file \
  --path server.log \
  --timeline 1m \
  --report json | jq '.timeline'
```

---

## 🛠️ Command Reference

### `/kafka-analyze` Command

```bash
/kafka-analyze [options]

Options:
  --source <type>       Log source: paste | file (default: paste)
  --path <file>         Log file path (required if source=file)
  --focus <areas>       Focus areas: producer,consumer,broker,lag,error
  --timeline <window>   Timeline window: 1m,5m,15m,1h,6h,1d
  --priority <levels>   Filter by priority: P0,P1,P2,P3 (default: P0,P1)
  --report <format>     Output format: markdown | json | slack (default: markdown)
```

### MCP Tools

#### `analyze_log`

Analyzes Kafka logs and returns structured results.

**Input Schema:**

```json
{
  "source": "paste" | "file",
  "content": "string (if source=paste)",
  "path": "string (if source=file)",
  "focus": ["producer", "consumer", "broker", "lag", "error"],
  "timeline": "1m" | "5m" | "15m" | "1h" | "6h" | "1d"
}
```

**Output:**

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

#### `get_lag` (Phase 2)

Queries consumer lag from Prometheus/Kafka Exporter.

---

## 📁 Project Structure

```
kafka-log-analyzer/
├── src/
│   ├── commands/           # CLI commands
│   │   └── kafka-analyze.ts
│   ├── mcp-server/         # MCP Server implementation
│   │   ├── index.ts
│   │   └── tools/
│   │       ├── analyze_log.ts
│   │       └── get_lag.ts
│   ├── hooks/              # Hook handlers (Phase 3)
│   ├── integrations/       # Feishu/Slack/JIRA (Phase 3)
│   ├── storage/            # SQLite persistence (Phase 4)
│   └── utils/              # Utilities
├── scripts/                # Python analysis scripts
│   ├── parse_kafka_log.py
│   ├── detect_anomalies.py
│   └── generate_report.py
├── references/             # Kafka reference docs
│   ├── kafka-patterns.md
│   ├── error-codes.md
│   └── tuning-guide.md
└── tests/                  # Test suites
```

---

## 🔧 Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMETHEUS_URL` | Prometheus endpoint (Phase 2) | `http://localhost:9090` |
| `KAFKA_EXPORTER_URL` | Kafka Exporter endpoint (Phase 2) | `http://localhost:9308` |
| `LOKI_URL` | Loki log endpoint (Phase 2) | `http://localhost:3100` |
| `SQLITE_PATH` | SQLite database path | `./storage/kafka-analyzer.db` |
| `LOG_LEVEL` | Logging level | `info` |

---

## 🗺️ Roadmap

| Version | Milestone | Features |
|---------|-----------|----------|
| **v0.1.0** | Alpha | Plugin skeleton + basic analysis |
| **v0.2.0** | Alpha | Enhanced commands + parameters |
| **v0.3.0** | Beta | Prometheus + Kafka Exporter integration |
| **v0.4.0** | Beta | Grafana alerts + Feishu/Slack/JIRA push |
| **v0.5.0** | RC | Historical trends + baseline comparison |
| **v1.0.0** | GA | Production-ready release |

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

```bash
# Development
npm install
npm run dev          # Watch mode
npm test             # Run tests
npm run lint         # Lint check
npm run build        # Build
```

---

## 📄 License

MIT © [saqqdy](https://github.com/saqqdy)

---

## 📚 Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Claude Code Plugins](https://docs.anthropic.com/claude-code/plugins)
