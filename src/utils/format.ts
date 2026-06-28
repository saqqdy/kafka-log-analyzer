/**
 * Output formatting utilities
 */

import type {
  Event,
  Anomaly,
  AnalysisResult,
  TimelineBucket,
  LagEntry,
  Priority,
} from '../types.js'

// ─── Event Formatting ──────────────────────────────────────────────

/** Format a single event for display */
export function formatEvent(event: Event, verbose = false): string {
  const priority = formatPriority(event.priority)
  const level = event.level.padEnd(5)
  const component = event.component.padEnd(8)
  const timestamp = event.timestamp

  if (verbose) {
    return `${priority} [${timestamp}] [${level}] [${component}] ${event.type}
  Message: ${event.message}
  ${event.metadata ? `Metadata: ${JSON.stringify(event.metadata)}` : ''}`
  }

  return `${priority} [${timestamp}] [${level}] [${component}] ${truncate(event.message, 80)}`
}

/** Format priority with color indicator */
export function formatPriority(priority: Priority): string {
  const indicators: Record<Priority, string> = {
    P0: '🔴 P0',
    P1: '🟠 P1',
    P2: '🟡 P2',
    P3: '🟢 P3',
  }
  return indicators[priority]
}

// ─── Anomaly Formatting ─────────────────────────────────────────────

/** Format a single anomaly for display */
export function formatAnomaly(anomaly: Anomaly, index?: number): string {
  const header =
    index !== undefined
      ? `\n#### ${index + 1}. ${formatAnomalyType(anomaly.type)} (${anomaly.severity})`
      : `\n#### ${formatAnomalyType(anomaly.type)} (${anomaly.severity})`

  return `${header}
- **Component**: ${anomaly.component}
- **Description**: ${anomaly.description}
- **Affected Events**: ${anomaly.affectedEvents}
- **Recommendation**: ${anomaly.recommendation}
${anomaly.metadata ? `- **Details**: ${JSON.stringify(anomaly.metadata)}` : ''}`
}

/** Format anomaly type to human-readable */
export function formatAnomalyType(type: string): string {
  const names: Record<string, string> = {
    error_rate_spike: 'Error Rate Spike',
    rebalance_storm: 'Rebalance Storm',
    lag_spike: 'Consumer Lag Spike',
    leader_instability: 'Leader Instability',
    replica_lag: 'Replica Lag',
    serialization_issue: 'Serialization Issue',
    network_problem: 'Network Problem',
  }
  return names[type] || type
}

// ─── Summary Formatting ─────────────────────────────────────────────

/** Format analysis summary for display */
export function formatSummary(result: AnalysisResult): string {
  const { summary, duration } = result

  return `
## Summary

### Overview
- **Total Events**: ${summary.total}
- **Duration**: ${formatDuration(duration)}
- **Anomalies Found**: ${result.anomalies.length}

### By Priority
${formatPriorityBreakdown(summary.byPriority)}

### By Component
${formatComponentBreakdown(summary.byComponent)}`
}

/** Format priority breakdown */
export function formatPriorityBreakdown(
  byPriority: AnalysisResult['summary']['byPriority']
): string {
  return `
| Priority | Count | Description |
|----------|-------|-------------|
| P0       | ${byPriority.P0.toString().padStart(5)} | Critical - Cluster down, data loss risk |
| P1       | ${byPriority.P1.toString().padStart(5)} | High - Lag > 10K, frequent rebalance |
| P2       | ${byPriority.P2.toString().padStart(5)} | Medium - Leader switch, transient errors |
| P3       | ${byPriority.P3.toString().padStart(5)} | Low - Warnings, notifications |`
}

/** Format component breakdown */
export function formatComponentBreakdown(
  byComponent: AnalysisResult['summary']['byComponent']
): string {
  const total = byComponent.producer + byComponent.consumer + byComponent.broker
  return `
| Component | Count | Percentage |
|-----------|-------|------------|
| Producer  | ${byComponent.producer.toString().padStart(5)} | ${((byComponent.producer / total) * 100).toFixed(1)}% |
| Consumer  | ${byComponent.consumer.toString().padStart(5)} | ${((byComponent.consumer / total) * 100).toFixed(1)}% |
| Broker    | ${byComponent.broker.toString().padStart(5)} | ${((byComponent.broker / total) * 100).toFixed(1)}% |`
}

// ─── Timeline Formatting ─────────────────────────────────────────────

/** Format timeline bucket for display */
export function formatTimelineBucket(bucket: TimelineBucket): string {
  const start = new Date(bucket.start).toLocaleTimeString()
  const end = new Date(bucket.end).toLocaleTimeString()

  return `
### ${start} - ${end}
- **Events**: ${bucket.count}
- **By Level**: INFO: ${bucket.byLevel.INFO}, WARN: ${bucket.byLevel.WARN}, ERROR: ${bucket.byLevel.ERROR}, FATAL: ${bucket.byLevel.FATAL}
- **By Component**: Producer: ${bucket.byComponent.producer}, Consumer: ${bucket.byComponent.consumer}, Broker: ${bucket.byComponent.broker}`
}

/** Format timeline for display */
export function formatTimeline(buckets: TimelineBucket[]): string {
  return `
## Timeline Distribution

${buckets.map(formatTimelineBucket).join('\n')}`
}

// ─── Lag Formatting ──────────────────────────────────────────────────

/** Format a single lag entry */
export function formatLagEntry(entry: LagEntry): string {
  const lagStr =
    entry.lag > 10000
      ? `🔴 ${entry.lag.toLocaleString()}`
      : entry.lag > 1000
        ? `🟠 ${entry.lag.toLocaleString()}`
        : `🟢 ${entry.lag.toLocaleString()}`

  return `${entry.group.padEnd(25)} | ${entry.topic.padEnd(20)} | P${entry.partition.toString().padStart(2)} | ${lagStr.padStart(15)}`
}

/** Format lag result for display */
export function formatLagResult(result: { lags: LagEntry[]; timestamp?: string }): string {
  const header = `
## Consumer Lag Report

**Timestamp**: ${result.timestamp || new Date().toISOString()}
**Total Entries**: ${result.lags.length}

| Consumer Group            | Topic               | Partition | Lag            |
|---------------------------|---------------------|-----------|----------------|`

  const rows = result.lags.map(formatLagEntry).join('\n')

  return `${header}
|---------------------------|---------------------|-----------|----------------|
${rows}`
}

// ─── Full Report Formatting ──────────────────────────────────────────

/** Format complete analysis report */
export function formatReport(result: AnalysisResult, verbose = false): string {
  let report = `# Kafka Log Analysis Report\n`
  report += formatSummary(result)

  if (result.timeline && result.timeline.length > 0) {
    report += formatTimeline(result.timeline)
  }

  if (result.anomalies.length > 0) {
    report += `\n## Anomalies Detected\n`
    report += result.anomalies.map((a, i) => formatAnomaly(a, i)).join('\n')
  }

  if (verbose && result.events.length > 0) {
    report += `\n## Events\n`
    const eventsToShow = result.events.slice(0, 100)
    report += eventsToShow.map((e) => formatEvent(e)).join('\n')
    if (result.events.length > 100) {
      report += `\n\n... and ${result.events.length - 100} more events`
    }
  }

  return report
}

// ─── Utility Functions ───────────────────────────────────────────────

/** Format duration in milliseconds to human readable */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/** Truncate string to specified length */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/** Format timestamp to local time */
export function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString()
}
