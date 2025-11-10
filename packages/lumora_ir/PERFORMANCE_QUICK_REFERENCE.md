# Performance Optimizations - Quick Reference

## Quick Start

### Enable All Optimizations (Default)

```typescript
import { SyncEngine } from '@lumora/ir';

const engine = new SyncEngine({
  reactDir: './web/src',
  flutterDir: './mobile/lib',
  enableParallelProcessing: true,  // Default: true
  parallelThreshold: 3,            // Default: 3
});
```

All optimizations are enabled by default. No additional configuration needed!

## Cache Management

### Get Cache Statistics

```typescript
const cache = engine.getCache();
const stats = cache.getStats();

console.log(`Cache hits: ${stats.astHits + stats.irHits}`);
console.log(`Cache misses: ${stats.astMisses + stats.irMisses}`);
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

const hitRate = cache.getHitRate();
console.log(`Overall hit rate: ${hitRate.overall.toFixed(1)}%`);
```

### Clear Cache

```typescript
// Clear all cache
engine.clearCache();

// Or invalidate specific file
const cache = engine.getCache();
cache.invalidate('/path/to/file.tsx');
```

### Disable Cache (for debugging)

```typescript
const cache = engine.getCache();
cache.disable();

// Re-enable
cache.enable();
```

## Parallel Processing

### Check Worker Status

```typescript
const processor = engine.getProcessor();
const stats = processor.getStats();

console.log(`Total workers: ${stats.totalWorkers}`);
console.log(`Busy workers: ${stats.busyWorkers}`);
console.log(`Available workers: ${stats.availableWorkers}`);
console.log(`Queued tasks: ${stats.queuedTasks}`);
```

### Disable Parallel Processing

```typescript
// Disable for debugging or single-threaded environments
engine.disableParallelProcessing();

// Re-enable
engine.enableParallelProcessing();
```

## Progress Tracking

### Display Progress in CLI

```typescript
import { getProgressTracker, CLIProgressDisplay } from '@lumora/ir';

const tracker = getProgressTracker();
const display = new CLIProgressDisplay(tracker);

// Progress will automatically display in terminal
```

### Custom Progress Handler

```typescript
const tracker = getProgressTracker();

tracker.onProgress((update) => {
  console.log(`${update.operationId}: ${update.percentage.toFixed(1)}%`);
  
  if (update.estimatedTimeRemaining) {
    const timeStr = ProgressTracker.formatTimeRemaining(update.estimatedTimeRemaining);
    console.log(`Time remaining: ${timeStr}`);
  }
});
```

### Manual Progress Tracking

```typescript
const tracker = getProgressTracker();

// Start operation
tracker.start('my-operation', 100, 'Processing files...');

// Update progress
for (let i = 0; i < 100; i++) {
  await processFile(files[i]);
  tracker.increment('my-operation', 1, `Processing ${files[i]}`);
}

// Complete
tracker.complete('my-operation', 'Done!');
```

## Performance Tips

### 1. Maximize Cache Hits
- Keep files stable during development
- Avoid unnecessary file modifications
- Use watch mode for continuous development

### 2. Optimize Batch Sizes
- Process 3+ files to trigger parallel processing
- Larger batches benefit more from parallelization
- Consider grouping related files

### 3. Monitor Performance
```typescript
// Check cache effectiveness
const hitRate = engine.getCache().getHitRate();
if (hitRate.overall < 50) {
  console.warn('Low cache hit rate - files changing frequently?');
}

// Check worker utilization
const stats = engine.getProcessor().getStats();
if (stats.queuedTasks > 10) {
  console.warn('High task queue - consider increasing workers');
}
```

### 4. Tune Configuration
```typescript
// For large projects
const engine = new SyncEngine({
  // ... other config
  enableParallelProcessing: true,
  parallelThreshold: 5,  // Higher threshold for larger batches
});

// Configure cache for large projects
const cache = getConversionCache({
  maxEntries: 2000,      // More entries
  maxMemoryMB: 200,      // More memory
  ttlSeconds: 7200,      // Longer TTL
});
```

## Troubleshooting

### Cache Not Working
```typescript
// Check if cache is enabled
const cache = engine.getCache();
console.log('Cache enabled:', cache.isEnabled());

// Check cache stats
const stats = cache.getStats();
console.log('Cache stats:', stats);
```

### Parallel Processing Issues
```typescript
// Check if parallel processing is enabled
console.log('Parallel enabled:', engine.isParallelProcessingEnabled());

// Check worker status
const processor = engine.getProcessor();
console.log('Workers initialized:', processor.isInitialized());
```

### Progress Not Showing
```typescript
// Ensure CLI display is created
import { getProgressTracker, CLIProgressDisplay } from '@lumora/ir';

const tracker = getProgressTracker();
const display = new CLIProgressDisplay(tracker);

// Check if operations are being tracked
const allProgress = tracker.getAllProgress();
console.log('Active operations:', allProgress.length);
```

## Performance Metrics

### Expected Performance

| Operation | Without Optimization | With Optimization | Improvement |
|-----------|---------------------|-------------------|-------------|
| Single file (first time) | 500ms | 500ms | 0% |
| Single file (cached) | 500ms | 50ms | 90% |
| 10 files (sequential) | 5s | 1.5s | 70% |
| 100 files (sequential) | 50s | 12s | 76% |

### Cache Hit Rates

| Scenario | Expected Hit Rate |
|----------|------------------|
| Initial conversion | 0% |
| Watch mode (no changes) | 100% |
| Active development | 70-90% |
| After git pull | 20-40% |

## API Reference

### ConversionCache
- `getAST(filePath)` - Get cached AST
- `setAST(filePath, ast)` - Cache AST
- `getIR(filePath)` - Get cached IR
- `setIR(filePath, ir)` - Cache IR
- `invalidate(filePath)` - Invalidate cache for file
- `clear()` - Clear all cache
- `getStats()` - Get cache statistics
- `getHitRate()` - Get cache hit rates
- `enable()` / `disable()` - Enable/disable cache

### ParallelProcessor
- `initialize()` - Initialize worker pool
- `process(task)` - Process single task
- `processMany(tasks)` - Process multiple tasks
- `getStats()` - Get worker statistics
- `shutdown()` - Shutdown worker pool

### ProgressTracker
- `start(id, total, message)` - Start tracking
- `update(id, current, message)` - Update progress
- `increment(id, amount, message)` - Increment progress
- `complete(id, message)` - Complete operation
- `cancel(id)` - Cancel operation
- `getProgress(id)` - Get progress for operation
- `getAllProgress()` - Get all active operations
- `onProgress(handler)` - Register progress handler

## Examples

See `PERFORMANCE_OPTIMIZATIONS.md` for detailed examples and use cases.
