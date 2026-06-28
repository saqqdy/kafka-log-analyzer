/**
 * Kafka Log Analyzer CLI — Quick experience without installation
 *
 * Usage: npx kafka-log-analyze <command> [options]
 *
 * Commands:
 *   analyze <file> [--focus F] [--timeline T]  Analyze log file
 *   analyze-paste                              Analyze pasted log content
 *   lag [--cluster C] [--group G] [--topic T]  Get consumer lag
 *   help                                       Show help
 *   version                                    Show version
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { analyzeLog } from './mcp-server/tools/analyze_log.js'
import { getLag } from './mcp-server/tools/get_lag.js'
import { VERSION } from './types.js'
import { formatDuration, formatLagResult, formatReport } from './utils/format.js'

const COMMANDS = ['analyze', 'analyze-paste', 'lag', 'help', 'version'] as const
type Command = (typeof COMMANDS)[number]

function printHelp(): void {
  console.log(`
🔍 Kafka Log Analyzer v${VERSION} — Intelligent Kafka Log Analysis

Usage:
  npx kafka-log-analyze <command> [options]

Commands:
  analyze <file>           Analyze a Kafka log file
    --focus F              Focus areas: producer,consumer,broker,lag,error
    --timeline T           Time window: 1m, 5m, 15m, 1h, 6h, 1d

  analyze-paste            Analyze log content from stdin
    --focus F              Focus areas (comma-separated)
    --timeline T           Time window

  lag                      Get consumer lag from Prometheus
    --cluster C            Cluster name
    --group G              Consumer group name
    --topic T              Topic name

  help                     Show this help
  version                  Show version

Examples:
  npx kafka-log-analyze analyze /var/log/kafka/server.log
  npx kafka-log-analyze analyze server.log --focus producer,error
  npx kafka-log-analyze analyze server.log --timeline 1h
  cat server.log | npx kafka-log-analyze analyze-paste
  npx kafka-log-analyze lag --cluster production --group order-processor

Environment Variables:
  PROMETHEUS_URL           Prometheus API URL (for lag command)
  KAFKA_EXPORTER_URL       Kafka Exporter URL
  LOG_LEVEL                Log level: debug, info, warn, error
`)
}

function printVersion(): void {
  console.log(`kafka-log-analyze v${VERSION}`)
}

async function runAnalyze(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      focus: { type: 'string', short: 'f' },
      timeline: { type: 'string', short: 't' },
      verbose: { type: 'boolean', short: 'v', default: false },
    },
    strict: false,
  })

  const file = args.find((a) => !a.startsWith('-'))
  if (!file) {
    console.error('Error: missing file argument')
    console.log('Usage: npx kafka-log-analyze analyze <file> [--focus F] [--timeline T]')
    process.exit(1)
  }

  const filePath = resolve(process.cwd(), file)
  if (!existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`)
    process.exit(1)
  }

  const focus = values.focus ? (values.focus as string).split(',') : undefined
  const timeline = values.timeline as string | undefined

  console.log(`\n🔍 Analyzing ${file}...\n`)

  const startTime = Date.now()
  const result = await analyzeLog({
    source: 'file',
    path: filePath,
    focus: focus as any,
    timeline: timeline as any,
  })
  const duration = Date.now() - startTime

  // Adapt AnalyzeLogOutput to AnalysisResult
  const adapted = {
    ...result,
    duration,
    summary: {
      ...result.summary,
      byComponent: { producer: 0, consumer: 0, broker: 0 },
    },
  }
  console.log(formatReport(adapted as any, values.verbose as boolean))
  console.log(`\n⏱️  Total time: ${formatDuration(duration)}`)
}

async function runAnalyzePaste(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      focus: { type: 'string', short: 'f' },
      timeline: { type: 'string', short: 't' },
      verbose: { type: 'boolean', short: 'v', default: false },
    },
    strict: false,
  })

  // Read from stdin
  let content = ''
  if (!process.stdin.isTTY) {
    for await (const chunk of process.stdin) {
      content += chunk
    }
  }

  if (!content) {
    console.error('Error: no content from stdin')
    console.log('Usage: cat log.txt | npx kafka-log-analyze analyze-paste')
    process.exit(1)
  }

  const focus = values.focus ? (values.focus as string).split(',') : undefined
  const timeline = values.timeline as string | undefined

  console.log(`\n🔍 Analyzing pasted content...\n`)

  const startTime = Date.now()
  const result = await analyzeLog({
    source: 'paste',
    content,
    focus: focus as any,
    timeline: timeline as any,
  })
  const duration = Date.now() - startTime

  const adapted = {
    ...result,
    duration,
    summary: {
      ...result.summary,
      byComponent: { producer: 0, consumer: 0, broker: 0 },
    },
  }
  console.log(formatReport(adapted as any, values.verbose as boolean))
  console.log(`\n⏱️  Total time: ${formatDuration(duration)}`)
}

async function runLag(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      cluster: { type: 'string', short: 'c' },
      group: { type: 'string', short: 'g' },
      topic: { type: 'string', short: 't' },
    },
    strict: false,
  })

  if (!process.env.PROMETHEUS_URL) {
    console.error('Error: PROMETHEUS_URL environment variable not set')
    console.log('Set it with: export PROMETHEUS_URL=http://localhost:9090')
    process.exit(1)
  }

  console.log(`\n📊 Fetching consumer lag...\n`)

  const startTime = Date.now()
  const result = await getLag({
    cluster: values.cluster as string,
    consumer_group: values.group as string,
    topic: values.topic as string,
  })
  const duration = Date.now() - startTime

  console.log(formatLagResult(result as any))
  console.log(`\n⏱️  Query time: ${formatDuration(duration)}`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] as Command

  if (!command || !COMMANDS.includes(command)) {
    printHelp()
    process.exit(1)
  }

  switch (command) {
    case 'help':
      printHelp()
      break
    case 'version':
      printVersion()
      break
    case 'analyze':
      await runAnalyze(args.slice(1))
      break
    case 'analyze-paste':
      await runAnalyzePaste(args.slice(1))
      break
    case 'lag':
      await runLag(args.slice(1))
      break
  }
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
