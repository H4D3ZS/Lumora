/**
 * Tests for ParallelProcessor
 */

import { ParallelProcessor, ProcessTask, TaskResult } from '../workers/parallel-processor';

describe('ParallelProcessor', () => {
  let processor: ParallelProcessor;

  beforeEach(() => {
    processor = new ParallelProcessor({ maxWorkers: 2 });
  });

  afterEach(async () => {
    await processor.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize worker pool', async () => {
      await processor.initialize();
      expect(processor.isInitialized()).toBe(true);
    });

    it('should create correct number of workers', async () => {
      await processor.initialize();
      const stats = processor.getStats();
      expect(stats.totalWorkers).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should track worker statistics', async () => {
      await processor.initialize();
      const stats = processor.getStats();
      
      expect(stats.totalWorkers).toBe(2);
      expect(stats.busyWorkers).toBe(0);
      expect(stats.availableWorkers).toBe(2);
      expect(stats.queuedTasks).toBe(0);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown worker pool', async () => {
      await processor.initialize();
      await processor.shutdown();
      
      expect(processor.isInitialized()).toBe(false);
      const stats = processor.getStats();
      expect(stats.totalWorkers).toBe(0);
    });
  });
});
