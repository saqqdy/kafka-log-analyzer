/**
 * Unit tests for analyze_log tool
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeLog } from '../src/mcp-server/tools/analyze_log.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('analyze_log tool', () => {
  const fixturesDir = join(__dirname, 'fixtures');
  let sampleLog: string;
  let expectedOutput: any;

  beforeAll(() => {
    sampleLog = readFileSync(join(fixturesDir, 'sample-kafka-log.txt'), 'utf-8');
    expectedOutput = JSON.parse(readFileSync(join(fixturesDir, 'expected-output.json'), 'utf-8'));
  });

  describe('paste input', () => {
    it('should parse paste content correctly', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
      });

      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(10);
      expect(result.summary.total).toBe(10);
    });

    it('should detect anomalies from paste content', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
      });

      expect(result.anomalies).toBeDefined();
      expect(result.anomalies.length).toBeGreaterThan(0);
    });

    it('should classify priorities correctly', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
      });

      expect(result.summary.byPriority).toHaveProperty('P0');
      expect(result.summary.byPriority).toHaveProperty('P1');
      expect(result.summary.byPriority).toHaveProperty('P2');
      expect(result.summary.byPriority).toHaveProperty('P3');
    });
  });

  describe('file input', () => {
    it('should parse file content correctly', async () => {
      const result = await analyzeLog({
        source: 'file',
        path: join(fixturesDir, 'sample-kafka-log.txt'),
      });

      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(10);
    });
  });

  describe('focus filtering', () => {
    it('should filter by producer focus', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
        focus: ['producer'],
      });

      expect(result.events).toBeDefined();
    });

    it('should filter by multiple focus areas', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
        focus: ['producer', 'consumer'],
      });

      expect(result.events).toBeDefined();
    });
  });

  describe('timeline analysis', () => {
    it('should support timeline window 1m', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
        timeline: '1m',
      });

      expect(result.events).toBeDefined();
    });

    it('should support timeline window 1h', async () => {
      const result = await analyzeLog({
        source: 'paste',
        content: sampleLog,
        timeline: '1h',
      });

      expect(result.events).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error when content missing for paste', async () => {
      await expect(analyzeLog({
        source: 'paste',
      })).rejects.toThrow('content is required when source=paste');
    });

    it('should throw error when path missing for file', async () => {
      await expect(analyzeLog({
        source: 'file',
      })).rejects.toThrow('path is required when source=file');
    });
  });
});