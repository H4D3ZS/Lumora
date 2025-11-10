/**
 * Tests for ConversionCache
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConversionCache, getConversionCache, resetConversionCache } from '../cache/conversion-cache';
import { LumoraIR } from '../types/ir-types';

describe('ConversionCache', () => {
  let cache: ConversionCache;
  let testDir: string;
  let testFile: string;

  beforeEach(() => {
    cache = new ConversionCache({ enabled: true, maxEntries: 10, ttlSeconds: 60 });
    testDir = path.join(__dirname, 'test-cache');
    testFile = path.join(testDir, 'test.tsx');

    // Create test directory and file
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'const test = "hello";');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    resetConversionCache();
  });

  describe('AST caching', () => {
    it('should cache and retrieve AST', () => {
      const ast = { type: 'Program', body: [] };
      
      cache.setAST(testFile, ast);
      const retrieved = cache.getAST(testFile);
      
      expect(retrieved).toEqual(ast);
    });

    it('should return undefined for non-existent cache entry', () => {
      const retrieved = cache.getAST('/non/existent/file.tsx');
      expect(retrieved).toBeUndefined();
    });

    it('should invalidate cache when file changes', () => {
      const ast = { type: 'Program', body: [] };
      cache.setAST(testFile, ast);
      
      // Modify file
      fs.writeFileSync(testFile, 'const test = "modified";');
      
      const retrieved = cache.getAST(testFile);
      expect(retrieved).toBeUndefined();
    });

    it('should track AST hits and misses', () => {
      const ast = { type: 'Program', body: [] };
      cache.setAST(testFile, ast);
      
      cache.getAST(testFile); // Hit
      cache.getAST('/non/existent.tsx'); // Miss
      
      const stats = cache.getStats();
      expect(stats.astHits).toBe(1);
      expect(stats.astMisses).toBe(1);
    });
  });

  describe('IR caching', () => {
    it('should cache and retrieve IR', () => {
      const ir: LumoraIR = {
        version: '1.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: testFile,
          generatedAt: Date.now(),
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: 1 },
        }],
      };
      
      cache.setIR(testFile, ir);
      const retrieved = cache.getIR(testFile);
      
      expect(retrieved).toEqual(ir);
    });

    it('should return undefined for non-existent cache entry', () => {
      const retrieved = cache.getIR('/non/existent/file.tsx');
      expect(retrieved).toBeUndefined();
    });

    it('should invalidate cache when file changes', () => {
      const ir: LumoraIR = {
        version: '1.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: testFile,
          generatedAt: Date.now(),
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: 1 },
        }],
      };
      
      cache.setIR(testFile, ir);
      
      // Modify file
      fs.writeFileSync(testFile, 'const test = "modified";');
      
      const retrieved = cache.getIR(testFile);
      expect(retrieved).toBeUndefined();
    });

    it('should track IR hits and misses', () => {
      const ir: LumoraIR = {
        version: '1.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: testFile,
          generatedAt: Date.now(),
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: 1 },
        }],
      };
      
      cache.setIR(testFile, ir);
      
      cache.getIR(testFile); // Hit
      cache.getIR('/non/existent.tsx'); // Miss
      
      const stats = cache.getStats();
      expect(stats.irHits).toBe(1);
      expect(stats.irMisses).toBe(1);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate specific file', () => {
      const ast = { type: 'Program', body: [] };
      const ir: LumoraIR = {
        version: '1.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: testFile,
          generatedAt: Date.now(),
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: 1 },
        }],
      };
      
      cache.setAST(testFile, ast);
      cache.setIR(testFile, ir);
      
      cache.invalidate(testFile);
      
      expect(cache.getAST(testFile)).toBeUndefined();
      expect(cache.getIR(testFile)).toBeUndefined();
    });

    it('should clear all caches', () => {
      const ast = { type: 'Program', body: [] };
      cache.setAST(testFile, ast);
      
      cache.clear();
      
      expect(cache.getAST(testFile)).toBeUndefined();
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('Cache statistics', () => {
    it('should calculate hit rate', () => {
      const ast = { type: 'Program', body: [] };
      cache.setAST(testFile, ast);
      
      cache.getAST(testFile); // Hit
      cache.getAST(testFile); // Hit
      cache.getAST('/non/existent.tsx'); // Miss
      
      const hitRate = cache.getHitRate();
      expect(hitRate.ast).toBeCloseTo(66.67, 1);
    });

    it('should track total entries', () => {
      const ast = { type: 'Program', body: [] };
      const ir: LumoraIR = {
        version: '1.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: testFile,
          generatedAt: Date.now(),
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {},
          children: [],
          metadata: { lineNumber: 1 },
        }],
      };
      
      cache.setAST(testFile, ast);
      cache.setIR(testFile, ir);
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
    });
  });

  describe('Cache configuration', () => {
    it('should respect enabled flag', () => {
      const disabledCache = new ConversionCache({ enabled: false });
      const ast = { type: 'Program', body: [] };
      
      disabledCache.setAST(testFile, ast);
      const retrieved = disabledCache.getAST(testFile);
      
      expect(retrieved).toBeUndefined();
    });

    it('should enable and disable cache', () => {
      cache.disable();
      expect(cache.isEnabled()).toBe(false);
      
      cache.enable();
      expect(cache.isEnabled()).toBe(true);
    });
  });

  describe('Global cache instance', () => {
    it('should return singleton instance', () => {
      const cache1 = getConversionCache();
      const cache2 = getConversionCache();
      
      expect(cache1).toBe(cache2);
    });

    it('should reset global instance', () => {
      const cache1 = getConversionCache();
      resetConversionCache();
      const cache2 = getConversionCache();
      
      expect(cache1).not.toBe(cache2);
    });
  });
});
