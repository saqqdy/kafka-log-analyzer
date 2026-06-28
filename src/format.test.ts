import { describe, it, expect } from 'vitest'
import { formatDuration, truncate, formatPriority, formatAnomalyType } from './utils/format.js'

describe('format', () => {
  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
    })

    it('should format seconds', () => {
      expect(formatDuration(1500)).toBe('1.50s')
    })

    it('should format minutes', () => {
      expect(formatDuration(90000)).toBe('1m 30s')
    })
  })

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('should truncate long strings', () => {
      expect(truncate('hello world this is a long string', 10)).toBe('hello w...')
    })
  })

  describe('formatPriority', () => {
    it('should format P0 as critical', () => {
      expect(formatPriority('P0')).toBe('🔴 P0')
    })

    it('should format P1 as high', () => {
      expect(formatPriority('P1')).toBe('🟠 P1')
    })
  })

  describe('formatAnomalyType', () => {
    it('should format error_rate_spike', () => {
      expect(formatAnomalyType('error_rate_spike')).toBe('Error Rate Spike')
    })

    it('should return original for unknown type', () => {
      expect(formatAnomalyType('unknown_type')).toBe('unknown_type')
    })
  })
})
