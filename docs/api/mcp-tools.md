# MCP Tools API Reference

> Complete API documentation for Kafka Log Analyzer MCP Tools

## Overview

Kafka Log Analyzer exposes the following tools via MCP (Model Context Protocol), callable from Claude Code or any MCP client.

---

## Tools

### `analyze_log`

Parse Kafka logs, extract events, and detect anomalies.

#### Input Schema

```typescript
{
  source: 'paste' | 'file',        // Data source type
  content?: string,                  // Log content (required when source=paste)
  path?: string,                     // File path (required when source=file)
  focus?: FocusArea[],               // Focus area filter
  timeline?: TimelineWindow          // Timeline window
}

type FocusArea = 'producer' | 'consumer' | 'broker' | 'lag' | 'error';
type TimelineWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
```

#### Output

```typescript
{
  events: Event[],                   // Extracted events list
  anomalies: Anomaly[],              // Detected anomalies
  summary: {                         // Analysis summary
    total: number,
    byPriority: {
      P0: number,
      P1: number,
      P2: number,
      P3: number
    },
    byComponent: {
      producer: number,
      consumer: number,
      broker: number
    }
  },
  timeline?: TimelineBucket[]        // Timeline distribution (when timeline specified)
}
```

#### Event Type Definition

```typescript
interface Event {
  timestamp: string;                 // Event timestamp
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: 'producer' | 'consumer' | 'broker';
  type: EventType;                   // Event type
  message: string;                   // Original message
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  metadata?: Record<string, unknown>;
}

type EventType =
  | 'send_success'
  | 'send_failure'
  | 'consumer_lag'
  | 'rebalance'
  | 'commit_failure'
  | 'buffer_exhausted'
  | 'leader_change'
  | 'offset_out_of_range'
  | 'serialization_error'
  | 'network_error'
  | 'auth_error';
```

#### Anomaly Type Definition

```typescript
interface Anomaly {
  type: AnomalyType;                 // Anomaly type
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  component: 'producer' | 'consumer' | 'broker';
  description: string;               // Anomaly description
  recommendation: string;            // Fix recommendation
  affectedEvents: number;            // Affected event count
  metadata?: Record<string, unknown>;
}

type AnomalyType =
  | 'error_rate_spike'               // Error rate spike
  | 'rebalance_storm'                // Rebalance storm
  | 'lag_spike'                      // Consumer lag spike
  | 'leader_instability'             // Leader frequent change
  | 'replica_lag'                    // Replica sync lag
  | 'serialization_issue'            // Serialization issue
  | 'network_problem';               // Network anomaly
```

#### Call Examples

**Paste Log Analysis:**

```json
{
  "source": "paste",
  "content": "[2026-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders\n[2026-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)",
  "focus": ["producer", "error"],
  "timeline": "1h"
}
```

**File Log Analysis:**

```json
{
  "source": "file",
  "path": "/var/log/kafka/server.log",
  "focus": ["consumer", "lag"],
  "timeline": "15m"
}
```

---

### `get_lag`

Get Consumer Lag metrics from Kafka Exporter / Prometheus.

> **Phase 2 Feature** — Requires Prometheus data source configuration

#### Input Schema

```typescript
{
  cluster?: string,                  // Cluster name (optional, default all clusters)
  consumer_group?: string,           // Consumer group name (optional)
  topic?: string                     // Topic name (optional)
}
```

#### Output

```typescript
{
  lags: LagEntry[],                  // Lag data list
  timestamp: string                  // Query timestamp
}

interface LagEntry {
  cluster: string;                   // Cluster name
  group: string;                     // Consumer group
  topic: string;                     // Topic
  partition: number;                 // Partition number
  currentOffset: number;             // Current offset
  endOffset: number;                 // End offset
  lag: number;                       // Lag count
  timestamp: string;                 // Data timestamp
}
```

#### Call Examples

**Query All Consumer Groups Lag:**

```json
{}
```

**Query Specific Cluster and Consumer Group:**

```json
{
  "cluster": "production",
  "consumer_group": "order-processor"
}
```

**Query Specific Topic:**

```json
{
  "topic": "orders"
}
```

---

### `timeline`

Statistical event distribution by time window.

#### Input Schema

```typescript
{
  events: Event[],                   // Event list
  window: TimelineWindow             // Time window
}

type TimelineWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
```

#### Output

```typescript
{
  buckets: TimelineBucket[],         // Time bucket list
  window: TimelineWindow,            // Window size used
  totalBuckets: number               // Total bucket count
}

interface TimelineBucket {
  start: string;                     // Bucket start time
  end: string;                       // Bucket end time
  count: number;                     // Event count
  byLevel: {                         // By level statistics
    INFO: number;
    WARN: number;
    ERROR: number;
    FATAL: number;
  },
  byComponent: {                     // By component statistics
    producer: number;
    consumer: number;
    broker: number;
  }
}
```

#### Call Example

```json
{
  "events": [
    { "timestamp": "2026-01-15 10:00:01", "level": "ERROR", "component": "producer", "type": "send_failure", "message": "Failed to send", "priority": "P1" }
  ],
  "window": "5m"
}
```

---

## Resources

### `kafka://metrics/{cluster}/lag`

Consumer Lag real-time metrics stream.

> **Phase 2 Feature**

#### Access Method

```typescript
// Subscribe via MCP Resource
const resource = await client.readResource({
  uri: 'kafka://metrics/production/lag'
});
```

#### Data Format

```typescript
{
  cluster: string;
  groups: {
    name: string;
    totalLag: number;
    partitions: {
      topic: string;
      partition: number;
      lag: number;
    }[];
  }[];
  timestamp: string;
}
```

---

### `kafka://history/{cluster}`

Historical analysis records.

> **Phase 4 Feature**

#### Access Method

```typescript
const resource = await client.readResource({
  uri: 'kafka://history/production'
});
```

---

## Error Handling

### Error Response Format

```typescript
{
  error: {
    code: string;                    // Error code
    message: string;                 // Error message
    details?: Record<string, unknown>;
  }
}
```

### Common Error Codes

| Error Code | Description | HTTP Equivalent |
|------------|-------------|-----------------|
| `INVALID_INPUT` | Input parameter validation failed | 400 |
| `FILE_NOT_FOUND` | Specified file not found | 404 |
| `PARSE_ERROR` | Log parsing failed | 422 |
| `PROMETHEUS_UNAVAILABLE` | Prometheus connection failed | 503 |
| `INTERNAL_ERROR` | Internal error | 500 |

### Error Handling Example

```typescript
try {
  const result = await analyzeLog({ source: 'file', path: '/nonexistent.log' });
} catch (error) {
  if (error.code === 'FILE_NOT_FOUND') {
    console.error('File not found:', error.message);
  }
}
```

---

## Priority Rules

### P0 (Critical)

Cluster downtime, data loss risk, completely unavailable.

### P1 (High)

Consumer Lag > 10K, frequent Rebalance, sustained error rate > 5%.

### P2 (Medium)

Leader switch, transient errors, configuration alerts.

### P3 (Low)

Warning messages, notification events, statistical information.

---

Related Documentation:
- [Architecture Overview](../architecture/overview.md)
- [Configuration Guide](../guide/configuration.md)
- [Command Reference](../guide/commands.md)