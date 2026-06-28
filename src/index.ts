/**
 * Kafka Log Analyzer - Main entry point
 */

// Tools
export { analyzeLog } from './mcp-server/tools/analyze_log.js'
export { getLag } from './mcp-server/tools/get_lag.js'

// Types
export type {
  Event,
  EventLevel,
  EventComponent,
  EventType,
  Priority,
  Anomaly,
  AnomalyType,
  AnalysisResult,
  AnalysisSummary,
  TimelineBucket,
  TimelineWindow,
  AnalyzeLogOptions,
  GetLagOptions,
  TimelineOptions,
  FocusArea,
  LagEntry,
  LagResult,
  AnalyzerConfig,
  CacheStore,
  CacheConfig,
  ErrorResponse,
  ErrorCode,
} from './types.js'
export { VERSION } from './types.js'

// Utils
export { logger } from './utils/logger.js'
export { config, loadConfig, getDefaultConfig, mergeConfig } from './utils/config.js'
export {
  formatEvent,
  formatAnomaly,
  formatSummary,
  formatReport,
  formatLagResult,
  formatDuration,
  truncate,
} from './utils/format.js'

// Errors
export * from './utils/errors.js'
