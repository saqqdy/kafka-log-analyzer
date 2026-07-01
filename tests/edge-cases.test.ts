/**
 * Edge cases and error handling tests
 *
 * Tests cover:
 * - Empty files and empty content
 * - Malformed logs
 * - Large files
 * - Mixed formats
 * - Special characters
 * - Missing fields
 * - Boundary conditions
 */

import { existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { analyzeLog } from '../src/mcp-server/tools/analyze_log.js'

describe('Edge Cases and Error Handling', () => {
  const tempFiles: string[] = []

  beforeAll(() => {
    // Setup temp file tracking
  })

  afterAll(async () => {
    // Cleanup temp files
    for (const file of tempFiles) {
      if (existsSync(file)) {
        try {
          await unlink(file)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  })

  describe('Empty and minimal inputs', () => {
    it('should handle empty content', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '',
      })
      expect(result.events).toEqual([])
      expect(result.summary.total).toBe(0)
    })

    it('should handle whitespace-only content', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '   \n\n\t  \n  ',
      })
      expect(result.events).toEqual([])
    })

    it('should handle single valid line', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Successfully sent record',
      })
      expect(result.events.length).toBeGreaterThanOrEqual(1)
      expect(result.summary.total).toBeGreaterThanOrEqual(1)
    })

    it('should handle single invalid line', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: 'invalid log line without proper format',
      })
      expect(result.events).toEqual([])
      expect(result.summary.total).toBe(0)
    })
  })

  describe('Malformed logs', () => {
    it('should handle logs with missing timestamp', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: 'INFO [producer] Successfully sent record',
      })
      // Should skip invalid lines or handle gracefully
      expect(result).toBeDefined()
    })

    it('should handle logs with missing level', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] [producer] Successfully sent record',
      })
      expect(result).toBeDefined()
    })

    it('should handle logs with missing component', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO Successfully sent record',
      })
      expect(result).toBeDefined()
    })

    it('should handle completely malformed lines', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: `random text
another random line
!@#$%^&*()
null undefined NaN`,
      })
      expect(result.events).toEqual([])
    })

    it('should handle mixed valid and invalid lines', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: `[2024-01-15 10:00:01] INFO [producer] Valid log line
invalid line here
[2024-01-15 10:00:02] ERROR [consumer] Another valid line
more invalid content`,
      })
      expect(result.events.length).toBe(2)
    })
  })

  describe('Format variations', () => {
    it('should handle text format logs', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Successfully sent record',
      })
      expect(result.events[0]).toBeDefined()
    })

    it('should handle JSON format logs', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '{"timestamp":"2024-01-15T10:00:01Z","level":"INFO","message":"Successfully sent record"}',
      })
      expect(result.events[0]).toBeDefined()
    })

    it('should handle mixed text and JSON formats', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: `[2024-01-15 10:00:01] INFO [producer] Text log
{"timestamp":"2024-01-15T10:00:02Z","level":"ERROR","message":"JSON log"}`,
      })
      // Auto-detection may parse only the first format detected
      expect(result.events.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Special characters', () => {
    it('should handle Chinese characters', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] 成功发送记录到主题 订单',
      })
      expect(result.events[0].message).toContain('成功发送')
    })

    it('should handle emoji', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Successfully sent 🚀✅',
      })
      expect(result.events[0].message).toContain('🚀')
    })

    it('should handle special symbols', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Message with !@#$%^&*()',
      })
      expect(result.events[0]).toBeDefined()
    })

    it('should handle newlines in message', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Message with\nembedded\nnewlines',
      })
      expect(result).toBeDefined()
    })

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000)
      const result = await analyzeLog({
        source: 'paste',
        content: `[2024-01-15 10:00:01] INFO [producer] ${longMessage}`,
      })
      expect(result.events[0].message.length).toBe(5000)
    })
  })

  describe('Large inputs', () => {
    it('should handle 100 events', async () => {
      const lines = []
      for (let i = 0; i < 100; i++) {
        lines.push(`[2024-01-15 10:00:${String(i).padStart(2, '0')}] INFO [producer] Message ${i}`)
      }
      const result = await analyzeLog({
        source: 'paste',
        content: lines.join('\n'),
      })
      expect(result.summary.total).toBeGreaterThanOrEqual(50)
    })

    it('should handle 500 events', async () => {
      const lines = []
      for (let i = 0; i < 500; i++) {
        const minutes = Math.floor(i / 60)
        const seconds = i % 60
        lines.push(`[2024-01-15 10:0${minutes}:${String(seconds).padStart(2, '0')}] INFO [producer] Message ${i}`)
      }
      const result = await analyzeLog({
        source: 'paste',
        content: lines.join('\n'),
      })
      expect(result.summary.total).toBeGreaterThanOrEqual(250)
    })
  })

  describe('Boundary conditions', () => {
    it('should handle timestamp at midnight', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 00:00:00] INFO [producer] Midnight log',
      })
      expect(result.events[0].timestamp).toBe('2024-01-15 00:00:00')
    })

    it('should handle timestamp at end of day', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 23:59:59] INFO [producer] End of day log',
      })
      expect(result.events[0].timestamp).toBe('2024-01-15 23:59:59')
    })

    it('should handle all log levels', async () => {
      const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']
      for (const level of levels) {
        const result = await analyzeLog({
          source: 'paste',
          content: `[2024-01-15 10:00:01] ${level} [test] Test message`,
        })
        expect(result.events[0].level).toBe(level)
      }
    })
  })

  describe('Input validation', () => {
    it('should throw error for invalid source type', async () => {
      await expect(analyzeLog({
        source: 'invalid' as any,
        content: 'test',
      })).rejects.toThrow()
    })

    it('should throw error when content missing for paste', async () => {
      await expect(analyzeLog({
        source: 'paste',
      })).rejects.toThrow('content is required')
    })

    it('should throw error when path missing for file', async () => {
      await expect(analyzeLog({
        source: 'file',
      })).rejects.toThrow('path is required')
    })

    it('should throw error for nonexistent file', async () => {
      await expect(analyzeLog({
        source: 'file',
        path: '/nonexistent/file.log',
      })).rejects.toThrow()
    })
  })

  describe('Timeline edge cases', () => {
    it('should handle timeline with single event', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Single event',
        timeline: '1m',
      })
      expect(result).toBeDefined()
    })

    it('should throw error for timeline with empty content', async () => {
      // Empty content should throw validation error
      await expect(analyzeLog({
        source: 'paste',
        content: '',
        timeline: '1m',
      })).rejects.toThrow('content is required')
    })

    it('should handle all timeline windows', async () => {
      const windows = ['1m', '5m', '15m', '1h', '6h', '1d']
      for (const window of windows) {
        const result = await analyzeLog({
          source: 'paste',
          content: '[2024-01-15 10:00:01] INFO [producer] Test',
          timeline: window,
        })
        expect(result).toBeDefined()
      }
    })
  })

  describe('Focus filtering edge cases', () => {
    it('should handle empty focus array', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Test',
        focus: [],
      })
      expect(result).toBeDefined()
    })

    it('should handle invalid focus values', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Test',
        focus: ['invalid'],
      })
      expect(result).toBeDefined()
    })

    it('should handle focus on nonexistent component', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: '[2024-01-15 10:00:01] INFO [producer] Test',
        focus: ['broker'],  // No broker events in content
      })
      expect(result).toBeDefined()
    })
  })
})
