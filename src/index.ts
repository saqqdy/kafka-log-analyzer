/**
 * Kafka Log Analyzer - Main entry point
 */

export { analyzeLog } from './mcp-server/tools/analyze_log.js'
export { getLag } from './mcp-server/tools/get_lag.js'
export { logger } from './utils/logger.js'
export { config, loadConfig } from './utils/config.js'
export * from './utils/errors.js'

export const VERSION = '0.1.0'
