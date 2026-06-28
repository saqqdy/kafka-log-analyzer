# 🔍 Kafka Log Analyzer

> AI-powered Kafka log analysis — intelligent diagnostics for Kafka clusters with Claude Code

[![npm version](https://img.shields.io/npm/v/kafka-log-analyzer.svg)](https://www.npmjs.com/package/kafka-log-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

### 📊 Intelligent Log Analysis (v0.1.0)

Structured parsing with zero configuration:

- **Multi-format Support** — Parse both text and JSON Kafka logs
- **11 Event Types** — send_success, send_failure, consumer_lag, rebalance, commit_failure, buffer_exhausted, leader_change, offset_out_of_range, serialization_error, network_error, auth_error
- **Anomaly Detection** — 7 built-in detectors for error spikes, rebalance storms, lag spikes, leader instability, replica lag, serialization issues, network problems

### 🎯 Priority Classification

Automatic severity grading (P0-P3):

| Priority | Severity | Examples |
|----------|----------|----------|
| 🟢 **P0 (Critical)** | Cluster down, data loss risk | Complete broker failure, unrecoverable corruption |
| 🟡 **P1 (High)** | Consumer lag > 10K, frequent rebalances | Sustained high lag, rebalance storms |
| 🟠 **P2 (Medium)** | Leader changes, transient errors | Leader election, temporary network issues |
| 🔴 **P3 (Low)** | Warnings, informational events | Configuration warnings, debug logs |

### 🔄 Multiple Output Formats

- **Markdown** — Detailed report with sections and recommendations
- **JSON** — Structured data for programmatic processing
- **Slack** — Compact format optimized for team channels

### 🖥️ Claude Code Integration

- **MCP Tools** — Call analysis from Claude Code or any MCP client
- **Slash Commands** — `/kafka-analyze` for quick analysis
- **Source Code Linking** — AI correlates errors with your Kafka configuration

---

## 🚀 Getting Started

### Option 1: Claude Code Plugin (Recommended)

This project is a **Claude Code Plugin**. Install via marketplace for one-click setup.

#### Method A: Plugin Marketplace (Recommended)

```bash
# In Claude Code, run:
/plugin marketplace add saqqdy/kafka-log-analyzer
/plugin install kafka-log-analyzer
```

#### Method B: Local Install

```bash
# 1. Go to your project
cd your-project

# 2. Install npm package
pnpm add -D kafka-log-analyzer

# 3. Copy plugin files
mkdir -p .claude/skills
cp -r node_modules/kafka-log-analyzer/.claude/skills/kafka-log-analyzer .claude/skills/
```

#### Available Commands

Type these commands in Claude Code:

| Command | Description | Example |
|---------|-------------|---------|
| `/kafka-analyze` | Analyze Kafka logs | `/kafka-analyze --source file --path server.log` |

#### Output Example

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

### Option 2: Programmatic Usage

```bash
pnpm add kafka-log-analyzer
```

```typescript
import { analyzeLog } from 'kafka-log-analyzer'

const result = await analyzeLog({
  source: 'file',
  path: '/var/log/kafka/server.log',
  focus: ['producer', 'error'],
  timeline: '1h'
})

console.log(`Total Events: ${result.summary.total}`)
console.log(`P0: ${result.summary.byPriority.P0}`)
```

### Option 3: CLI (Zero-Install)

```bash
# In any directory, run directly:
npx kafka-log-analyze --source file --path /var/log/kafka/server.log
npx kafka-log-analyze --source paste <<EOF
[2024-01-15 10:00:01] ERROR [producer] Failed to send record
EOF
```

### Option 4: Clone and Run Examples

```bash
git clone https://github.com/saqqdy/kafka-log-analyzer.git
cd kafka-log-analyzer
pnpm install

# Run examples
node dist/cli.js --source file --path tests/fixtures/sample-kafka-log.txt
```

### 📊 Basic Usage

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

## 📋 Version Roadmap

| Version | Codename | Theme | Status |
|---------|----------|-------|--------|
| v0.1.0 | Sentinel | Core analysis engine + MCP tools | ✅ Current |
| v0.2.0 | Watchtower | Enhanced commands + CLI improvements | 📋 Planned |
| v0.3.0 | Guardian | Prometheus + Kafka Exporter integration | 📋 Planned |
| v0.4.0 | Dispatcher | Grafana alerts + Feishu/Slack/JIRA push | 📋 Planned |
| v0.5.0 | Historian | Historical trends + baseline comparison | 📋 Planned |
| v1.0.0 | Architect | Production-ready release | 📋 Planned |

---

## 🗂️ Project Structure

```
kafka-log-analyzer/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (required)
├── .claude/skills/
│   └── kafka-log-analyzer/      # Skill prompts (core product)
│       └── skill.md             # Commands + execution flow
├── src/
│   ├── index.ts                 # Public API exports
│   ├── cli.ts                   # CLI entry point
│   ├── types.ts                 # Core types
│   ├── mcp-server/              # MCP Server implementation
│   │   ├── index.ts             # Server entry
│   │   └── tools/
│   │       ├── analyze_log.ts   # Log analysis tool
│   │       └── get_lag.ts       # Consumer lag tool (Phase 2)
│   └── utils/                   # Utilities
│       ├── config.ts            # Config management
│       └── format.ts            # Output formatting
├── scripts/                     # Python analysis scripts
│   └── parse_kafka_log.py       # Log parser
├── references/                  # Kafka reference docs
│   ├── kafka-patterns.md        # Common patterns
│   ├── error-codes.md           # Error code reference
│   └── tuning-guide.md          # Performance tuning
├── tests/                       # Test suites
│   └ fixtures/                  # Test data
└   └ analyze_log.test.ts        # Unit tests
└── docs/                        # VitePress docs
```

---

## 🛠️ Development

```bash
pnpm install          # Install dependencies
pnpm run lint         # ESLint + auto-fix
pnpm run typecheck    # TypeScript check
pnpm run test         # Run tests (vitest)
pnpm run build        # Build (ESM + CJS)
pnpm run docs:dev     # Start docs server
```

---

## 🆚 Comparison

### vs Traditional Log Analysis

| Dimension | grep/awk | Kafka Log Analyzer |
|-----------|----------|-------------------|
| Output | Raw text lines | Structured `Event[]` + anomalies |
| **Anomalies** | ❌ Manual spotting | ✅ 7 built-in detectors |
| **Priority** | ❌ No | ✅ P0-P3 automatic grading |
| **Timeline** | ❌ No | ✅ Time-window distribution |
| **Recommendations** | ❌ No | ✅ Actionable fix suggestions |
| **Formats** | ❌ Text only | ✅ Markdown, JSON, Slack |

---

## 📄 License

[MIT](./LICENSE)

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

Contributions welcome! See [Contributing Guide](CONTRIBUTING.md).

```bash
npm run dev          # Watch mode
npm test             # Run tests
npm run build        # Build
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture/overview.md) | Technical architecture |
| [API Reference](docs/api/mcp-tools.md) | MCP Tools API |
| [Deployment](docs/deployment/guide.md) | Deployment guide |
| [Contributing](CONTRIBUTING.md) | Development guide |

---

## 📄 License

MIT © [saqqdy](https://github.com/saqqdy)

---

## 📚 Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Claude Code Plugins](https://docs.anthropic.com/claude-code/plugins)
