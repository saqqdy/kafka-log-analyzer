/**
 * Configuration management
 */

export interface Config {
  prometheusUrl?: string
  prometheusTimeout?: number
  kafkaExporterUrl?: string
  lokiUrl?: string
  grafanaWebhookPort?: number
  feishuWebhookUrl?: string
  slackWebhookUrl?: string
  sqlitePath?: string
  logLevel?: string
}

export function loadConfig(): Config {
  return {
    prometheusUrl: process.env.PROMETHEUS_URL,
    prometheusTimeout: parseInt(process.env.PROMETHEUS_TIMEOUT || '30000'),
    kafkaExporterUrl: process.env.KAFKA_EXPORTER_URL,
    lokiUrl: process.env.LOKI_URL,
    grafanaWebhookPort: parseInt(process.env.GRAFANA_WEBHOOK_PORT || '3100'),
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    sqlitePath: process.env.SQLITE_PATH || './storage/kafka-analyzer.db',
    logLevel: process.env.LOG_LEVEL || 'info',
  }
}

export const config = loadConfig()
