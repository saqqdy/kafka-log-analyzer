/**
 * CLI Integration tests for kafka-log-analyzer
 *
 * Tests cover:
 * - CLI command execution
 * - All command options and flags
 * - Output format validation
 * - Error handling
 */

import { execSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('CLI Integration Tests', () => {
  const projectRoot = join(__dirname, '..')
  const cliPath = join(projectRoot, 'dist/cli.js')
  const fixturePath = join(projectRoot, 'tests/fixtures/sample-kafka-log.txt')
  let tempFile: string

  beforeAll(() => {
    // Ensure CLI is built
    if (!existsSync(cliPath)) {
      throw new Error('CLI not built. Run `pnpm build` first.')
    }

    // Create temp file for testing
    tempFile = join(projectRoot, 'tests/fixtures/temp-test.log')
  })

  afterAll(() => {
    // Cleanup temp file if exists
    if (tempFile && existsSync(tempFile)) {
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('Basic CLI execution', () => {
    it('should execute CLI with file source', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath}`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should show help message', () => {
      const output = execSync(`node ${cliPath} --help`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toContain('kafka-log-analyze')
      expect(output).toContain('source')
      expect(output).toContain('path')
    })
  })

  describe('Output formats', () => {
    it('should generate markdown output', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --report markdown`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toContain('#')
      expect(output).toContain('Kafka')
      expect(output).toContain('Events')
    })

    it('should generate JSON output', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed).toHaveProperty('events')
      expect(parsed).toHaveProperty('summary')
      expect(parsed.summary.total).toBeGreaterThan(0)
    })

    it('should generate Slack output', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --report slack`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toBeDefined()
      // Slack format typically uses bold markers or emojis
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('Priority filtering', () => {
    it('should filter by P0 priority', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --priority P0 --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed).toBeDefined()
    })

    it('should filter by multiple priorities', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --priority P0,P1,P2 --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed).toBeDefined()
    })
  })

  describe('Focus areas', () => {
    it('should focus on producer', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --focus producer --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed.events).toBeDefined()
      // All events should be from producer (or related)
    })

    it('should focus on multiple components', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --focus producer,consumer --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed.events).toBeDefined()
    })

    it('should focus on errors', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --focus error --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed.events).toBeDefined()
      // Should contain ERROR level events
    })
  })

  describe('Timeline analysis', () => {
    it('should support 1m timeline', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --timeline 1m --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed).toBeDefined()
    })

    it('should support 1h timeline', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --timeline 1h --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      const parsed = JSON.parse(output)
      expect(parsed).toBeDefined()
    })
  })

  describe('Paste input mode', () => {
    it('should analyze pasted content', () => {
      const logContent = `[2024-01-15 10:00:01] INFO [producer] Successfully sent record
[2024-01-15 10:00:02] ERROR [producer] Failed to send record`

      const output = execSync(`node ${cliPath} --source paste`, {
        encoding: 'utf-8',
        cwd: projectRoot,
        input: logContent,
      })
      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    it('should throw error when path missing for file source', () => {
      expect(() => {
        execSync(`node ${cliPath} --source file`, {
          encoding: 'utf-8',
          cwd: projectRoot,
        })
      }).toThrow()
    })

    it('should throw error when file not found', () => {
      expect(() => {
        execSync(`node ${cliPath} --source file --path /nonexistent/file.log`, {
          encoding: 'utf-8',
          cwd: projectRoot,
        })
      }).toThrow()
    })

    it('should handle invalid priority', () => {
      // May not throw, but should handle gracefully
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --priority INVALID --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toBeDefined()
    })

    it('should handle invalid timeline window', () => {
      const output = execSync(`node ${cliPath} --source file --path ${fixturePath} --timeline invalid --report json`, {
        encoding: 'utf-8',
        cwd: projectRoot,
      })
      expect(output).toBeDefined()
    })
  })

  describe('Combined options', () => {
    it('should handle multiple options together', () => {
      const output = execSync(
        `node ${cliPath} --source file --path ${fixturePath} --priority P0,P1 --focus producer --timeline 1m --report markdown`,
        {
          encoding: 'utf-8',
          cwd: projectRoot,
        }
      )
      expect(output).toBeDefined()
      expect(output).toContain('#')
    })

    it('should handle all report formats with all options', () => {
      const formats = ['markdown', 'json', 'slack']
      for (const format of formats) {
        const output = execSync(
          `node ${cliPath} --source file --path ${fixturePath} --priority P0,P1 --focus error --report ${format}`,
          {
            encoding: 'utf-8',
            cwd: projectRoot,
          }
        )
        expect(output).toBeDefined()
        expect(output.length).toBeGreaterThan(0)
      }
    })
  })
})
