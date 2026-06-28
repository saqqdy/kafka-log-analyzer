#!/usr/bin/env node
/**
 * /kafka-analyze Command
 *
 * Analyzes Kafka logs and generates formatted reports.
 */

import { analyzeLog } from '../mcp-server/tools/analyze_log.js';

interface CommandOptions {
  source: 'paste' | 'file';
  content?: string;
  path?: string;
  focus?: string[];
  timeline?: string;
  priority?: string[];
  report: 'markdown' | 'json' | 'slack';
}

// Parse command arguments
function parseArgs(args: string[]): CommandOptions {
  const options: CommandOptions = {
    source: 'paste',
    report: 'markdown',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--source') {
      const value = args[++i];
      if (value !== 'paste' && value !== 'file') {
        throw new Error(`Invalid source: ${value}. Must be 'paste' or 'file'`);
      }
      options.source = value;
    } else if (arg === '--focus') {
      const value = args[++i];
      options.focus = value.split(',');
    } else if (arg === '--timeline') {
      options.timeline = args[++i];
    } else if (arg === '--priority') {
      const value = args[++i];
      options.priority = value.split(',');
    } else if (arg === '--report') {
      const value = args[++i];
      if (value !== 'markdown' && value !== 'json' && value !== 'slack') {
        throw new Error(`Invalid report format: ${value}`);
      }
      options.report = value;
    } else if (arg === '--path') {
      options.path = args[++i];
    } else if (arg.startsWith('--')) {
      // Skip unknown flags
      i++;
    }
  }

  return options;
}

// Format Markdown report
function formatMarkdownReport(result: Awaited<ReturnType<typeof analyzeLog>>): string {
  const lines: string[] = [];

  lines.push('# Kafka Log Analysis Report');
  lines.push('');
  lines.push(`**Total Events**: ${result.summary.total}`);
  lines.push('');
  lines.push('## Priority Summary');
  lines.push('');
  lines.push(`- **P0 (Critical)**: ${result.summary.byPriority.P0}`);
  lines.push(`- **P1 (High)**: ${result.summary.byPriority.P1}`);
  lines.push(`- **P2 (Medium)**: ${result.summary.byPriority.P2}`);
  lines.push(`- **P3 (Low)**: ${result.summary.byPriority.P3}`);
  lines.push('');

  if (result.anomalies.length > 0) {
    lines.push('## Detected Anomalies');
    lines.push('');

    for (const anomaly of result.anomalies) {
      const emoji = {
        P0: '🔴',
        P1: '🟠',
        P2: '🟡',
        P3: '🟢',
      }[anomaly.severity] || '⚪';

      lines.push(`### ${emoji} ${anomaly.type} (${anomaly.severity})`);
      lines.push('');
      lines.push(`**Component**: ${anomaly.component}`);
      lines.push('');
      lines.push(`**Description**: ${anomaly.description}`);
      lines.push('');

      if (anomaly.recommendation) {
        lines.push(`**Recommendation**: ${anomaly.recommendation}`);
        lines.push('');
      }

      if (anomaly.events.length > 0) {
        lines.push('**Related Events**:');
        lines.push('');
        for (const event of anomaly.events.slice(0, 3)) {
          lines.push(`- [${event.timestamp}] ${event.level}: ${event.message}`);
        }
        lines.push('');
      }
    }
  } else {
    lines.push('## ✅ No Anomalies Detected');
    lines.push('');
  }

  if (result.events.length > 0) {
    lines.push('## Event Summary (Top 10)');
    lines.push('');
    lines.push('| Timestamp | Level | Component | Message |');
    lines.push('|-----------|-------|-----------|---------|');
    for (const event of result.events.slice(0, 10)) {
      lines.push(`| ${event.timestamp} | ${event.level} | ${event.component} | ${event.message.slice(0, 50)}... |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Format Slack report
function formatSlackReport(result: Awaited<ReturnType<typeof analyzeLog>>): string {
  const lines: string[] = [];

  lines.push('📊 **Kafka Log Analysis**');
  lines.push('');
  lines.push(`Total: ${result.summary.total} | P0: ${result.summary.byPriority.P0} | P1: ${result.summary.byPriority.P1}`);
  lines.push('');

  if (result.anomalies.length > 0) {
    lines.push('⚠️ **Anomalies**:');
    for (const anomaly of result.anomalies.slice(0, 5)) {
      lines.push(`• ${anomaly.severity}: ${anomaly.type} - ${anomaly.description}`);
    }
  } else {
    lines.push('✅ No anomalies detected');
  }

  return lines.join('\n');
}

// Main command handler
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  try {
    const options = parseArgs(args);

    // For paste mode, read content from stdin or prompt
    if (options.source === 'paste' && !options.content) {
      // Read from stdin
      const chunks: string[] = [];
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      options.content = chunks.join('');
    }

    // Validate
    if (options.source === 'paste' && !options.content) {
      console.error('Error: content is required for paste mode. Pipe log content or use --path');
      process.exit(1);
    }
    if (options.source === 'file' && !options.path) {
      console.error('Error: --path is required for file mode');
      process.exit(1);
    }

    // Analyze
    const result = await analyzeLog({
      source: options.source,
      content: options.content,
      path: options.path,
      focus: options.focus,
      timeline: options.timeline,
    });

    // Filter by priority
    if (options.priority && options.priority.length > 0) {
      result.anomalies = result.anomalies.filter((a) =>
        options.priority!.includes(a.severity)
      );
    }

    // Format output
    let output: string;
    switch (options.report) {
      case 'json':
        output = JSON.stringify(result, null, 2);
        break;
      case 'slack':
        output = formatSlackReport(result);
        break;
      case 'markdown':
      default:
        output = formatMarkdownReport(result);
        break;
    }

    console.info(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();