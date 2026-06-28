/**
 * Kafka Log Analyzer - Main entry point
 */

// Tools
export { analyzeLog } from './mcp-server/tools/analyze_log.js'
export { getLag } from './mcp-server/tools/get_lag.js'

// Types
export type {
  AnalysisResult,
  AnalysisSummary,
  AnalyzeLogOptions,
  AnalyzerConfig,
  Anomaly,
  AnomalyType,
  CacheConfig,
  CacheStore,
  ErrorCode,
  ErrorResponse,
  Event,
  EventComponent,
  EventLevel,
  EventType,
  FocusArea,
  GetLagOptions,
  LagEntry,
  LagResult,
  Priority,
  TimelineBucket,
  TimelineOptions,
  TimelineWindow,
} from './types.js'
export { VERSION } from './types.js'

export { config, getDefaultConfig, loadConfig, mergeConfig } from './utils/config.js'
// Errors
export * from './utils/errors.js'
export {
  formatAnomaly,
  formatDuration,
  formatEvent,
  formatLagResult,
  formatReport,
  formatSummary,
  truncate,
} from './utils/format.js'

// Utils
export { logger } from './utils/logger.js'
