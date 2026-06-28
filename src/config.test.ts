import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, getDefaultConfig, mergeConfig } from './utils/config.js'

describe('config', () => {
  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig()
      expect(config.prometheusUrl).toBe('http://localhost:9090')
      expect(config.logLevel).toBe('info')
    })
  })

  describe('DEFAULT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONFIG.prometheusTimeout).toBe(30000)
      expect(DEFAULT_CONFIG.sqlitePath).toBe('./storage/kafka-analyzer.db')
    })
  })

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const merged = mergeConfig({ logLevel: 'debug' })
      expect(merged.logLevel).toBe('debug')
      expect(merged.prometheusUrl).toBe(DEFAULT_CONFIG.prometheusUrl)
    })
  })
})
