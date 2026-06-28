import { describe, expect, it } from 'vitest'
import { VERSION } from './types.js'

describe('types', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
