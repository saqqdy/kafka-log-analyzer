# Introduction

> Intelligent Kafka log analysis with Claude Code — anomaly detection, priority classification, and actionable recommendations.

## Quick Links

- [Installation](/guide/installation) — Get started in minutes
- [Quick Start](/guide/quick-start) — See it in action
- [API Reference](/api/mcp-tools) — MCP Tools documentation
- [Roadmap](/guide/roadmap) — Version plans

## The Problem

Traditional Kafka debugging requires manual log grepping:

```bash
grep ERROR server.log | wc -l
# → 156 errors, but what's the pattern?
```

Questions it can't answer:
- Which errors are critical vs noise?
- What's the timeline of the incident?
- What actions should I take?
- How do I share findings with my team?

## The Solution

Kafka Log Analyzer provides **intelligent analysis** through three layers:

| Layer | Capability | Output |
|-------|------------|--------|
| **Log Parsing** | Extract events from Kafka logs | 11 event types + metadata |
| **Anomaly Detection** | 7 built-in detectors | Prioritized findings (P0-P3) |
| **Report Generation** | Multiple formats | Markdown, JSON, Slack-ready |

## Key Features

### 📊 Intelligent Log Analysis

- **Multi-format** — Parse text and JSON Kafka logs
- **11 Event Types** — send_success, send_failure, consumer_lag, rebalance, etc.
- **7 Anomaly Detectors** — error spikes, rebalance storms, lag spikes, leader instability, replica lag, serialization issues, network problems

### 🎯 Priority Classification

Automatic severity grading:

| Priority | Severity | Example |
|----------|----------|---------|
| 🟢 P0 (Critical) | Cluster down | Complete broker failure |
| 🟡 P1 (High) | High lag | Consumer lag > 10K messages |
| 🟠 P2 (Medium) | Transient issues | Leader changes, temporary errors |
| 🔴 P3 (Low) | Warnings | Configuration warnings, debug logs |

### 🔄 Multiple Output Formats

- **Markdown** — Detailed report with sections and recommendations
- **JSON** — Structured data for programmatic processing
- **Slack** — Compact format optimized for team channels

### 🖥️ Claude Code Integration

In Claude Code, use natural language commands:

| Command | Purpose |
|---------|---------|
| `/kafka-analyze` | Analyze logs and detect anomalies |

## Example Output

```
/kafka-analyze --source file --path server.log

📊 Analyzing server.log...

📋 Summary:
  Total Events: 847
  P0 (Critical): 3
  P1 (High): 12

⚠️ Anomalies:
  🔴 send_failure_spike (P0)
     → Error rate 15% exceeds threshold (5%)
     → Check broker availability and network connectivity

  🟠 consumer_lag (P1)
     → Consumer group order-processor lag: 15,000 messages
     → Consider scaling consumer instances

💡 Recommendations:
  1. Check broker availability
  2. Review consumer group configuration
```

## Comparison

| Dimension | grep/awk | Kafka Log Analyzer |
|-----------|----------|-------------------|
| Output | Raw text lines | Structured `Event[]` + anomalies |
| **Anomalies** | ❌ Manual spotting | ✅ 7 built-in detectors |
| **Priority** | ❌ No | ✅ P0-P3 automatic grading |
| **Timeline** | ❌ No | ✅ Time-window distribution |
| **Recommendations** | ❌ No | ✅ Actionable fix suggestions |

## Get Started

Choose your path:

### 1. Claude Code Plugin (Recommended)

```bash
# Plugin marketplace
/plugin marketplace add saqqdy/kafka-log-analyzer
/plugin install kafka-log-analyzer
```

### 2. CLI (Zero-Install)

```bash
npx kafka-log-analyze --source file --path server.log
```

### 3. Clone & Explore

```bash
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
pnpm install
pnpm run build
node dist/cli.js --source file --path tests/fixtures/sample-kafka-log.txt
```

## Project Status

| Version | Theme | Status |
|---------|-------|--------|
| v0.1.0 | Core analysis engine | ✅ Released |
| v0.3.0 | Prometheus integration | 📋 Planned |
| v0.4.0 | Alert dispatch | 📋 Planned |
| v1.0.0 | Production-ready | 📋 Planned |

See [Roadmap](/guide/roadmap) for details.

## License

MIT — use freely in personal and commercial projects.