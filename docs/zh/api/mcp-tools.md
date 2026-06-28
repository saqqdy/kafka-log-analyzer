# MCP Tools API Reference

> Kafka Log Analyzer MCP Tools 完整 API 文档

## 概述

Kafka Log Analyzer 通过 MCP (Model Context Protocol) 暴露以下工具，可从 Claude Code 或任何 MCP 客户端调用。

---

## Tools

### `analyze_log`

解析 Kafka 日志，提取事件并检测异常。

#### 输入 Schema

```typescript
{
  source: 'paste' | 'file',        // 数据源类型
  content?: string,                  // 日志内容（source=paste 时必填）
  path?: string,                     // 文件路径（source=file 时必填）
  focus?: FocusArea[],               // 关注点过滤
  timeline?: TimelineWindow          // 时间线窗口
}

type FocusArea = 'producer' | 'consumer' | 'broker' | 'lag' | 'error';
type TimelineWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
```

#### 输出

```typescript
{
  events: Event[],                   // 提取的事件列表
  anomalies: Anomaly[],              // 检测到的异常
  summary: {                         // 分析摘要
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
  timeline?: TimelineBucket[]        // 时间线分布（当指定 timeline 时）
}
```

#### 事件类型定义

```typescript
interface Event {
  timestamp: string;                 // 事件时间戳
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: 'producer' | 'consumer' | 'broker';
  type: EventType;                   // 事件类型
  message: string;                   // 原始消息
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

#### 异常类型定义

```typescript
interface Anomaly {
  type: AnomalyType;                 // 异常类型
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  component: 'producer' | 'consumer' | 'broker';
  description: string;               // 异常描述
  recommendation: string;            // 修复建议
  affectedEvents: number;            // 影响的事件数
  metadata?: Record<string, unknown>;
}

type AnomalyType =
  | 'error_rate_spike'               // 错误率突增
  | 'rebalance_storm'                // Rebalance 风暴
  | 'lag_spike'                      // 消费积压突增
  | 'leader_instability'             // Leader 频繁切换
  | 'replica_lag'                    // 副本同步延迟
  | 'serialization_issue'            // 序列化问题
  | 'network_problem';               // 网络异常
```

#### 调用示例

**粘贴日志分析：**

```json
{
  "source": "paste",
  "content": "[2026-01-15 10:00:01] ERROR [producer] Failed to send record to topic orders\n[2026-01-15 10:00:02] WARN  [consumer] lag exceeded threshold (5000 messages)",
  "focus": ["producer", "error"],
  "timeline": "1h"
}
```

**文件日志分析：**

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

从 Kafka Exporter / Prometheus 获取 Consumer Lag 指标。

> **Phase 2 功能** — 需要 Prometheus 数据源配置

#### 输入 Schema

```typescript
{
  cluster?: string,                  // 集群名称（可选，默认所有集群）
  consumer_group?: string,           // 消费组名称（可选）
  topic?: string                     // Topic 名称（可选）
}
```

#### 输出

```typescript
{
  lags: LagEntry[],                  // Lag 数据列表
  timestamp: string                  // 查询时间戳
}

interface LagEntry {
  cluster: string;                   // 集群名称
  group: string;                     // 消费组
  topic: string;                     // Topic
  partition: number;                 // 分区号
  currentOffset: number;             // 当前偏移量
  endOffset: number;                 // 末端偏移量
  lag: number;                       // 积压数量
  timestamp: string;                 // 数据时间戳
}
```

#### 调用示例

**查询所有消费组 Lag：**

```json
{}
```

**查询指定集群和消费组：**

```json
{
  "cluster": "production",
  "consumer_group": "order-processor"
}
```

**查询指定 Topic：**

```json
{
  "topic": "orders"
}
```

---

### `timeline`

按时间窗口统计事件分布。

#### 输入 Schema

```typescript
{
  events: Event[],                   // 事件列表
  window: TimelineWindow             // 时间窗口
}

type TimelineWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
```

#### 输出

```typescript
{
  buckets: TimelineBucket[],         // 时间桶列表
  window: TimelineWindow,            // 使用的窗口大小
  totalBuckets: number               // 总桶数
}

interface TimelineBucket {
  start: string;                     // 桶起始时间
  end: string;                       // 桶结束时间
  count: number;                     // 事件数
  byLevel: {                         // 按级别统计
    INFO: number;
    WARN: number;
    ERROR: number;
    FATAL: number;
  },
  byComponent: {                     // 按组件统计
    producer: number;
    consumer: number;
    broker: number;
  }
}
```

#### 调用示例

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

Consumer Lag 实时指标流。

> **Phase 2 功能**

#### 访问方式

```typescript
// 通过 MCP Resource 订阅
const resource = await client.readResource({
  uri: 'kafka://metrics/production/lag'
});
```

#### 数据格式

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

历史分析记录。

> **Phase 4 功能**

#### 访问方式

```typescript
const resource = await client.readResource({
  uri: 'kafka://history/production'
});
```

---

## 错误处理

### 错误响应格式

```typescript
{
  error: {
    code: string;                    // 错误码
    message: string;                 // 错误信息
    details?: Record<string, unknown>;
  }
}
```

### 常见错误码

| 错误码 | 说明 | HTTP 等价 |
|--------|------|-----------|
| `INVALID_INPUT` | 输入参数验证失败 | 400 |
| `FILE_NOT_FOUND` | 指定文件不存在 | 404 |
| `PARSE_ERROR` | 日志解析失败 | 422 |
| `PROMETHEUS_UNAVAILABLE` | Prometheus 连接失败 | 503 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

### 错误处理示例

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

## 优先级规则

### P0 (Critical)

集群宕机、数据丢失风险、完全不可用。

### P1 (High)

Consumer Lag > 10K、频繁 Rebalance、持续错误率 > 5%。

### P2 (Medium)

Leader 切换、瞬时错误、配置告警。

### P3 (Low)

警告信息、通知事件、统计信息。

---

相关文档：
- [架构概览](../architecture/overview.md)
- [配置指南](../guide/configuration.md)
- [命令参考](../guide/commands.md)