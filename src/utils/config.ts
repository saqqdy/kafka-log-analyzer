/**
 * Configuration management
 */

import type { AnalyzerConfig } from '../types.js'

/** Default configuration values */
export const DEFAULT_CONFIG: AnalyzerConfig = {
  prometheusUrl: 'http://localhost:9090',
  prometheusTimeout: 30000,
  kafkaExporterUrl: 'http://localhost:9308',
  lokiUrl: 'http://localhost:3100',
  grafanaWebhookPort: 3100,
  sqlitePath: './storage/kafka-analyzer.db',
  logLevel: 'info',
  excludePaths: [],
}

/** Get default configuration */
export function getDefaultConfig(): AnalyzerConfig {
  return { ...DEFAULT_CONFIG }
}

/** Load configuration from environment variables */
export function loadConfig(): AnalyzerConfig {
  return {
    prometheusUrl: process.env.PROMETHEUS_URL || DEFAULT_CONFIG.prometheusUrl,
    prometheusTimeout: parseInt(
      process.env.PROMETHEUS_TIMEOUT || String(DEFAULT_CONFIG.prometheusTimeout)
    ),
    kafkaExporterUrl: process.env.KAFKA_EXPORTER_URL || DEFAULT_CONFIG.kafkaExporterUrl,
    lokiUrl: process.env.LOKI_URL || DEFAULT_CONFIG.lokiUrl,
    grafanaWebhookPort: parseInt(
      process.env.GRAFANA_WEBHOOK_PORT || String(DEFAULT_CONFIG.grafanaWebhookPort)
    ),
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    sqlitePath: process.env.SQLITE_PATH || DEFAULT_CONFIG.sqlitePath,
    logLevel: (process.env.LOG_LEVEL || DEFAULT_CONFIG.logLevel) as AnalyzerConfig['logLevel'],
    excludePaths: DEFAULT_CONFIG.excludePaths,
  }
}

/** Merge user config with defaults */
export function mergeConfig(userConfig: Partial<AnalyzerConfig>): AnalyzerConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  }
}

/** Global config instance */
export const config = loadConfig()
