/**
 * analyze_log Tool
 *
 * Analyzes Kafka logs by calling Python scripts for parsing and anomaly detection.
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Types
interface AnalyzeLogInput {
  source: 'paste' | 'file'
  content?: string
  path?: string
  focus?: string[]
  timeline?: string
}

interface Event {
  timestamp: string
  level: string
  component: string
  message: string
  metadata?: Record<string, unknown>
}

interface Anomaly {
  type: string
  severity: 'P0' | 'P1' | 'P2' | 'P3'
  component: string
  description: string
  events: Event[]
  recommendation?: string
}

interface AnalyzeLogOutput {
  events: Event[]
  anomalies: Anomaly[]
  summary: {
    total: number
    byPriority: {
      P0: number
      P1: number
      P2: number
      P3: number
    }
  }
}

// Get scripts directory path (relative to project root)
function getScriptsDir(): string {
  // From src/mcp-server/tools/ -> scripts/
  return path.resolve(__dirname, '../../../scripts')
}

// Map Python severity to P0-P3
function mapSeverity(severity: string): 'P0' | 'P1' | 'P2' | 'P3' {
  const map: Record<string, 'P0' | 'P1' | 'P2' | 'P3'> = {
    critical: 'P0',
    high: 'P1',
    medium: 'P2',
    low: 'P3',
  }
  return map[severity] || 'P3'
}

// Execute Python script
async function executePython(scriptName: string, args: string[]): Promise<string> {
  const scriptsDir = getScriptsDir()
  const scriptPath = path.join(scriptsDir, scriptName)

  return new Promise((resolve, reject) => {
    const process = spawn('python3', [scriptPath, ...args], {
      cwd: scriptsDir,
    })

    let stdout = '',
     stderr = ''

    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Python script failed: ${stderr}`))
      }
    })

    process.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Analyze Kafka logs
 */
export async function analyzeLog(input: AnalyzeLogInput): Promise<AnalyzeLogOutput> {
  // Validate input
  if (input.source === 'paste' && !input.content) {
    throw new Error('content is required when source=paste')
  }
  if (input.source === 'file' && !input.path) {
    throw new Error('path is required when source=file')
  }

  // Build arguments for parse_kafka_log.py
  // Note: Python script accepts positional argument, not --file flag
  const fs = await import('node:fs/promises')
  const os = await import('node:os')

  let filePath: string,
   tempFile: string | null = null,
   needsCleanup = false

  if (input.source === 'paste') {
    // For paste, create temp file
    tempFile = path.join(os.tmpdir(), `kafka-log-${Date.now()}.txt`)
    await fs.writeFile(tempFile, input.content!)
    filePath = tempFile
    needsCleanup = true
  } else {
    // For file input, use the provided path directly
    filePath = path.resolve(input.path!)
  }

  // Build args: positional input file + optional flags
  const parseArgs: string[] = [filePath]
  if (input.timeline) {
    parseArgs.push('--timeline', '--timeline-window', input.timeline)
  }

  try {
    // Execute parsing script
    const parsedOutput = await executePython('parse_kafka_log.py', parseArgs)
    const parsedData = JSON.parse(parsedOutput)

    // Write parsed data to temp JSON file for anomaly detection
    const tempJsonFile = path.join(os.tmpdir(), `kafka-events-${Date.now()}.json`)
    await fs.writeFile(tempJsonFile, JSON.stringify(parsedData))

    try {
      // Execute anomaly detection (accepts positional JSON file argument)
      const anomalyArgs: string[] = [tempJsonFile]
      const anomalyOutput = await executePython('detect_anomalies.py', anomalyArgs)
      const anomalyResult = JSON.parse(anomalyOutput)
      // Python returns {anomalies: [...], total_anomalies, critical, high, medium, low}
      const rawAnomalies: unknown[] = Array.isArray(anomalyResult)
        ? anomalyResult
        : anomalyResult.anomalies || []

      // Map Python severity (critical/high/medium/low) to P0-P3
      const mappedAnomalies = (rawAnomalies as Record<string, unknown>[]).map((a) => ({
        ...a,
        severity: mapSeverity(a.severity as string),
      })) as Anomaly[]

      const summary = {
        total: parsedData.events?.length || 0,
        byPriority: {
          P0: mappedAnomalies.filter((a) => a.severity === 'P0').length,
          P1: mappedAnomalies.filter((a) => a.severity === 'P1').length,
          P2: mappedAnomalies.filter((a) => a.severity === 'P2').length,
          P3: mappedAnomalies.filter((a) => a.severity === 'P3').length,
        },
      }

      return {
        events: parsedData.events || [],
        anomalies: mappedAnomalies,
        summary,
      }
    } finally {
      // Clean up temp JSON file
      await fs.unlink(tempJsonFile)
    }
  } finally {
    // Clean up temp log file if created
    if (needsCleanup && tempFile) {
      await fs.unlink(tempFile)
    }
  }
}
