import { describe, it, expect } from 'vitest'
import { VERSION } from './types.js'

describe('types', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
