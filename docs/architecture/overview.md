# Architecture Overview

> Kafka Log Analyzer technical architecture design

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Runtime                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   Commands    │  │     Hooks     │  │   Prompts     │      │
│  │               │  │               │  │               │      │
│  │ /kafka-analyze│  │ on_alert      │  │ kafka_diag    │      │
│  │ /kafka-lag    │  │ scheduled     │  │               │      │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘      │
│          │                  │                                   │
│          └──────────────────┼───────────────────────────────────┤
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    MCP Server                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │   Tools     │  │  Resources  │  │  Prompts    │    │  │
│  │  │             │  │             │  │             │    │  │
│  │  │ analyze_log │  │ kafka://    │  │             │    │  │
│  │  │ get_lag     │  │ metrics     │  │             │    │  │
│  │  │ timeline    │  │ history     │  │             │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │         │                                                    │
│  │         ▼                                                    │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Analysis Engine                        │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│  │  │
│  │  │  │ Python      │  │  Anomaly    │  │  Report     ││  │  │
│  │  │  │ Scripts     │  │  Detector   │  │  Generator  ││  │  │
│  │  │  │ (Reuse)     │  │  (7 types)  │  │             ││  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘│  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Data Layer                            │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ Prometheus  │  │    Loki     │  │   SQLite    │    │  │
│  │  │ Exporter    │  │   (Logs)    │  │  (History)  │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server

The MCP Server is the core component, responsible for:

- **Tools**: Providing `analyze_log`, `get_lag`, `timeline`, etc.
- **Resources**: Providing real-time metrics and historical data subscription
- **Prompts**: Providing diagnostic templates

Technology choices:
- TypeScript + `@modelcontextprotocol/sdk`
- Node.js >= 18.0

### 2. Analysis Engine

The analysis engine reuses existing Python scripts:

| Component | Function | Implementation |
|-----------|----------|----------------|
| Log Parser | Parse Kafka logs | `scripts/parse_kafka_log.py` |
| Anomaly Detector | Detect anomaly patterns | `scripts/detect_anomalies.py` |
| Report Generator | Generate diagnostic reports | `scripts/generate_report.py` |

Integration method:
```typescript
// src/analysis/parser.ts
import { spawn } from 'child_process';

async function parseLog(content: string) {
  const result = await spawn('python3', [
    'scripts/parse_kafka_log.py',
    '--input', '-'
  ]);
  return JSON.parse(result.stdout);
}
```

### 3. Data Layer

The data layer contains three data sources:

#### Prometheus / Kafka Exporter
- Real-time metrics query
- Consumer Lag monitoring
- Broker performance data

#### Loki
- Log aggregation query
- LogQL query syntax
- Time range filtering

#### SQLite
- Historical analysis records
- Trend comparison data
- Baseline storage

## Data Flow

### Real-time Analysis Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Kafka       │ ───▶ │ Prometheus  │ ───▶ │ Grafana     │
│ Exporter    │      │             │      │ Alert       │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                                 ▼ Trigger Hook
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Loki / ES   │ ◀─── │ MCP Server  │ ◀─── │ Claude Code │
│ (Logs)      │      │             │      │ Plugin      │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │                    ▼                    │
       │            ┌─────────────┐             │
       └───────────▶ │ Analysis    │ ◀───────────┘
                    │ Engine      │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Report      │ ──▶ Markdown / Slack / Feishu
                    └─────────────┘
```

### Command Invocation Flow

```
/kafka-analyze --source file --path server.log
       │
       ▼
┌─────────────┐
│ Command     │ Parse parameters
│ Handler     │
└─────────────┘
       │
       ▼ Call MCP Tool
┌─────────────┐
│ analyze_log │
│ Tool        │
└─────────────┘
       │
       ▼ Execute analysis
┌─────────────┐
│ Python      │ Parse + Detect
│ Scripts     │
└─────────────┘
       │
       ▼ Return results
┌─────────────┐
│ Markdown    │ Format output
│ Formatter   │
└─────────────┘
```

## Layered Architecture

```
Presentation Layer
├── Commands      (/kafka-analyze, /kafka-lag)
├── Prompts       (Diagnostic templates)
└── Output Formats (Markdown, JSON, Slack)

Application Layer
├── MCP Server    (Tool registration and routing)
├── Hooks         (Auto-trigger logic)
└── Integrations  (Feishu/Slack/JIRA)

Domain Layer
├── Analysis Engine (Log parsing, anomaly detection)
├── Comparator      (Historical comparison)
└── Report Generator (Report generation)

Infrastructure Layer
├── Data Sources    (Prometheus, Loki, SQLite)
├── Python Scripts  (Reuse existing scripts)
└── Utilities       (Logging, configuration, error handling)
```

## Technical Decisions

### Why Reuse Python Scripts?

| Factor | Rewrite to TypeScript | Reuse Python | Decision |
|--------|----------------------|--------------|----------|
| Verification | Needs re-verification | Already verified | ✅ Reuse |
| Development Time | 2-3 weeks | 0 weeks | ✅ Reuse |
| Maintenance Cost | Unified stack | Two sets | ✅ Acceptable |
| Performance | Possibly faster | Adequate | ✅ Reuse |

### Why Choose SQLite?

| Factor | PostgreSQL | SQLite | Decision |
|--------|------------|--------|----------|
| Deployment Complexity | Needs standalone deployment | Zero config | ✅ SQLite |
| Data Volume | Supports massive | Suitable for medium | ✅ SQLite |
| Query Capability | More powerful | Adequate | ✅ SQLite |
| Portability | Needs migration | Single file | ✅ SQLite |

## Extension Points

### 1. Add New Data Source

Add new connector in `src/mcp-server/connectors/`:

```typescript
// connectors/new-source.ts
export class NewSourceConnector {
  async query(params: QueryParams): Promise<Result> {
    // Implement query logic
  }
}
```

### 2. Add New Detector

Add new detector in `scripts/detect_anomalies.py`:

```python
def detect_new_anomaly(events):
    # Implement detection logic
    return anomalies
```

### 3. Add New Output Format

Add new format in `src/utils/report-formatter.ts`:

```typescript
export function formatToNewFormat(result: AnalysisResult): string {
  // Implement formatting logic
}
```

## Performance Considerations

| Scenario | Target | Implementation |
|----------|--------|----------------|
| Log Parsing | > 10,000 lines/sec | Python script optimization |
| Analysis Delay (1MB) | < 5s | Async processing + cache |
| MCP Tool Response | < 500ms | Direct call + preload |
| Hook Trigger Delay | < 30s | Deduplication + merge window |

## Security Considerations

| Security Item | Implementation |
|---------------|----------------|
| Input Validation | TypeScript type checking + schema validation |
| API Authentication | Environment variables for secrets |
| Log Sanitization | No sensitive data logging |
| Permission Control | MCP Server permission configuration |

---

Related Documentation:
- [API Reference](../api/mcp-tools.md)
- [Deployment Guide](../deployment/guide.md)