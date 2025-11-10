/**
 * Tests for ProgressTracker
 */

import { ProgressTracker, ProgressUpdate } from '../progress/progress-tracker';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    tracker = new ProgressTracker();
  });

  describe('Basic operations', () => {
    it('should start tracking an operation', () => {
      tracker.start('op1', 100, 'Test operation');
      
      const progress = tracker.getProgress('op1');
      expect(progress).toBeDefined();
      expect(progress?.total).toBe(100);
      expect(progress?.current).toBe(0);
      expect(progress?.percentage).toBe(0);
    });

    it('should update progress', () => {
      tracker.start('op1', 100);
      tracker.update('op1', 50);
      
      const progress = tracker.getProgress('op1');
      expect(progress?.current).toBe(50);
      expect(progress?.percentage).toBe(50);
    });

    it('should increment progress', () => {
      tracker.start('op1', 100);
      tracker.increment('op1', 10);
      tracker.increment('op1', 5);
      
      const progress = tracker.getProgress('op1');
      expect(progress?.current).toBe(15);
      expect(progress?.percentage).toBe(15);
    });

    it('should complete an operation', () => {
      tracker.start('op1', 100);
      tracker.complete('op1', 'Done');
      
      const progress = tracker.getProgress('op1');
      expect(progress).toBeUndefined();
    });

    it('should cancel an operation', () => {
      tracker.start('op1', 100);
      tracker.cancel('op1');
      
      const progress = tracker.getProgress('op1');
      expect(progress).toBeUndefined();
    });
  });

  describe('Progress handlers', () => {
    it('should call progress handlers', () => {
      const handler = jest.fn();
      tracker.onProgress(handler);
      
      tracker.start('op1', 100);
      tracker.update('op1', 50);
      
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should unregister progress handlers', () => {
      const handler = jest.fn();
      tracker.onProgress(handler);
      tracker.offProgress(handler);
      
      tracker.start('op1', 100);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      tracker.onProgress(handler1);
      tracker.onProgress(handler2);
      tracker.clearHandlers();
      
      tracker.start('op1', 100);
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Multiple operations', () => {
    it('should track multiple operations', () => {
      tracker.start('op1', 100);
      tracker.start('op2', 200);
      
      const allProgress = tracker.getAllProgress();
      expect(allProgress).toHaveLength(2);
    });

    it('should handle operations independently', () => {
      tracker.start('op1', 100);
      tracker.start('op2', 200);
      
      tracker.update('op1', 50);
      tracker.update('op2', 100);
      
      const progress1 = tracker.getProgress('op1');
      const progress2 = tracker.getProgress('op2');
      
      expect(progress1?.percentage).toBe(50);
      expect(progress2?.percentage).toBe(50);
    });
  });

  describe('Time estimation', () => {
    it('should estimate time remaining', (done) => {
      tracker.start('op1', 100);
      
      setTimeout(() => {
        tracker.update('op1', 50);
        
        const progress = tracker.getProgress('op1');
        expect(progress?.estimatedTimeRemaining).toBeDefined();
        expect(progress?.estimatedTimeRemaining).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('Formatting utilities', () => {
    it('should format time remaining', () => {
      expect(ProgressTracker.formatTimeRemaining(5000)).toBe('5s');
      expect(ProgressTracker.formatTimeRemaining(65000)).toBe('1m 5s');
      expect(ProgressTracker.formatTimeRemaining(3665000)).toBe('1h 1m');
    });

    it('should format progress bar', () => {
      const bar = ProgressTracker.formatProgressBar(50, 10);
      expect(bar).toContain('█');
      expect(bar).toContain('░');
      expect(bar).toContain('50.0%');
    });
  });
});
