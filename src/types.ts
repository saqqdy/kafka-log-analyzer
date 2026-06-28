/**
 * Kafka Log Analyzer — Core type definitions
 */

// ─── Version ──────────────────────────────────────────────────────

/** Version constant */
export const VERSION = '0.1.0' as const

// ─── Event Types ───────────────────────────────────────────────────

/** Event level */
export type EventLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

/** Event component */
export type EventComponent = 'producer' | 'consumer' | 'broker'

/** Event type enumeration */
export type EventType =
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
  | 'auth_error'

/** Priority level */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

/** Single event extracted from log */
export interface Event {
  /** Event timestamp (ISO 8601) */
  timestamp: string
  /** Event level */
  level: EventLevel
  /** Component that generated the event */
  component: EventComponent
  /** Event type */
  type: EventType
  /** Original log message */
  message: string
  /** Priority classification */
  priority: Priority
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

// ─── Anomaly Types ─────────────────────────────────────────────────

/** Anomaly type enumeration */
export type AnomalyType =
  | 'error_rate_spike'
  | 'rebalance_storm'
  | 'lag_spike'
  | 'leader_instability'
  | 'replica_lag'
  | 'serialization_issue'
  | 'network_problem'

/** Detected anomaly */
export interface Anomaly {
  /** Anomaly type */
  type: AnomalyType
  /** Severity level */
  severity: Priority
  /** Affected component */
  component: EventComponent
  /** Human-readable description */
  description: string
  /** Fix recommendation */
  recommendation: string
  /** Number of affected events */
  affectedEvents: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

// ─── Analysis Result ───────────────────────────────────────────────

/** Analysis summary statistics */
export interface AnalysisSummary {
  /** Total event count */
  total: number
  /** Events by priority */
  byPriority: {
    P0: number
    P1: number
    P2: number
    P3: number
  }
  /** Events by component */
  byComponent: {
    producer: number
    consumer: number
    broker: number
  }
}

/** Timeline bucket for time-windowed analysis */
export interface TimelineBucket {
  /** Bucket start time (ISO 8601) */
  start: string
  /** Bucket end time (ISO 8601) */
  end: string
  /** Event count in this bucket */
  count: number
  /** Events by level */
  byLevel: {
    INFO: number
    WARN: number
    ERROR: number
    FATAL: number
  }
  /** Events by component */
  byComponent: {
    producer: number
    consumer: number
    broker: number
  }
}

/** Time window options */
export type TimelineWindow = '1m' | '5m' | '15m' | '1h' | '6h' | '1d'

/** Full analysis result */
export interface AnalysisResult {
  /** Extracted events */
  events: Event[]
  /** Detected anomalies */
  anomalies: Anomaly[]
  /** Analysis summary */
  summary: AnalysisSummary
  /** Timeline distribution (when timeline requested) */
  timeline?: TimelineBucket[]
  /** Analysis duration in ms */
  duration: number
}

// ─── Input Options ──────────────────────────────────────────────────

/** Focus area filter options */
export type FocusArea = 'producer' | 'consumer' | 'broker' | 'lag' | 'error'

/** Options for analyze_log tool */
export interface AnalyzeLogOptions {
  /** Data source type */
  source: 'paste' | 'file'
  /** Log content (required when source=paste) */
  content?: string
  /** File path (required when source=file) */
  path?: string
  /** Focus area filter */
  focus?: FocusArea[]
  /** Timeline window for distribution analysis */
  timeline?: TimelineWindow
}

/** Options for get_lag tool */
export interface GetLagOptions {
  /** Cluster name (optional) */
  cluster?: string
  /** Consumer group name (optional) */
  consumer_group?: string
  /** Topic name (optional) */
  topic?: string
}

/** Options for timeline analysis */
export interface TimelineOptions {
  /** Events to analyze */
  events: Event[]
  /** Time window size */
  window: TimelineWindow
}

// ─── Lag Types ──────────────────────────────────────────────────────

/** Single lag entry */
export interface LagEntry {
  /** Cluster name */
  cluster: string
  /** Consumer group name */
  group: string
  /** Topic name */
  topic: string
  /** Partition number */
  partition: number
  /** Current consumer offset */
  currentOffset: number
  /** End offset (latest) */
  endOffset: number
  /** Lag (endOffset - currentOffset) */
  lag: number
  /** Data timestamp (ISO 8601) */
  timestamp: string
}

/** Lag query result */
export interface LagResult {
  /** Lag entries */
  lags: LagEntry[]
  /** Query timestamp (ISO 8601) */
  timestamp: string
}

// ─── Configuration ──────────────────────────────────────────────────

/** Cache storage backend */
export interface CacheStore {
  get: <T>(key: string) => T | undefined
  set: <T>(key: string, value: T, ttl?: number) => void
  has: (key: string) => boolean
  delete: (key: string) => boolean
  clear: () => void
}

/** Cache configuration */
export interface CacheConfig {
  /** Enable in-memory session cache (default: true) */
  sessionCache: boolean
  /** Enable filesystem cache (default: true) */
  fsCache: boolean
  /** Filesystem cache directory */
  cacheDir: string
  /** Default TTL in seconds (default: 86400 = 24h) */
  defaultTTL: number
}

/** Analyzer configuration */
export interface AnalyzerConfig {
  /** Prometheus API URL */
  prometheusUrl?: string
  /** Prometheus timeout in ms */
  prometheusTimeout?: number
  /** Kafka Exporter URL */
  kafkaExporterUrl?: string
  /** Loki log API URL */
  lokiUrl?: string
  /** Grafana webhook port */
  grafanaWebhookPort?: number
  /** Feishu webhook URL */
  feishuWebhookUrl?: string
  /** Slack webhook URL */
  slackWebhookUrl?: string
  /** SQLite database path */
  sqlitePath?: string
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  /** Cache configuration */
  cache?: CacheConfig
  /** Paths to exclude from analysis */
  excludePaths?: string[]
}

// ─── MCP Resource Types ─────────────────────────────────────────────

/** Metrics resource data */
export interface MetricsResource {
  /** Cluster name */
  cluster: string
  /** Consumer groups with lag */
  groups: {
    name: string
    totalLag: number
    partitions: {
      topic: string
      partition: number
      lag: number
    }[]
  }[]
  /** Data timestamp */
  timestamp: string
}

/** History resource data */
export interface HistoryResource {
  /** Cluster name */
  cluster: string
  /** Historical analysis records */
  records: {
    timestamp: string
    summary: AnalysisSummary
    topAnomalies: Anomaly[]
  }[]
}

// ─── Error Response ─────────────────────────────────────────────────

/** Error response format */
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

/** Error codes */
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'FILE_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'PROMETHEUS_UNAVAILABLE'
  | 'INTERNAL_ERROR'
