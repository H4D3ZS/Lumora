# Lumora Bidirectional Sync Engine

The Bidirectional Sync Engine enables real-time synchronization between React and Flutter codebases through the Lumora IR (Intermediate Representation).

## Architecture

The sync engine consists of five main components:

1. **FileWatcher** - Monitors React and Flutter files for changes
2. **ChangeQueue** - Queues and batches file changes with prioritization
3. **SyncEngine** - Converts files to IR and generates target framework code
4. **ConflictDetector** - Detects simultaneous changes to both versions
5. **SyncStatusTracker** - Tracks and reports sync status

## Usage

### Basic Setup

```typescript
import { BidirectionalSync } from '@lumora/ir';

// Define converter and generator functions
const reactToIR = async (filePath: string) => {
  // Parse React file and convert to Lumora IR
  // Implementation depends on your React parser
};

const flutterToIR = async (filePath: string) => {
  // Parse Flutter file and convert to Lumora IR
  // Implementation depends on your Flutter parser
};

const irToReact = async (ir: LumoraIR, outputPath: string) => {
  // Generate React code from IR
  // Implementation depends on your React generator
};

const irToFlutter = async (ir: LumoraIR, outputPath: string) => {
  // Generate Flutter code from IR
  // Implementation depends on your Flutter generator
};

// Create sync instance
const sync = new BidirectionalSync({
  sync: {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
    reactToIR,
    flutterToIR,
    irToReact,
    irToFlutter,
  },
  watcher: {
    debounceMs: 100,
  },
  queue: {
    batchSize: 10,
    batchDelayMs: 500,
  },
  conflictDetector: {
    conflictWindowMs: 5000,
  },
});

// Start watching
sync.start();

// Stop when done
await sync.stop();
```

### Status Monitoring

```typescript
// Monitor sync status
sync.onStatusUpdate((event) => {
  console.log(`Status: ${event.status}`);
  console.log(`Message: ${event.message}`);
  
  if (event.statistics) {
    console.log(`Total syncs: ${event.statistics.totalSyncs}`);
    console.log(`Success rate: ${event.statistics.successfulSyncs}/${event.statistics.totalSyncs}`);
  }
});

// Get current status
const statusTracker = sync.getStatusTracker();
console.log(statusTracker.formatForCLI());
```

### Conflict Handling

```typescript
// Monitor conflicts
sync.onConflict((conflict) => {
  console.warn('Conflict detected!');
  console.log(`React file: ${conflict.reactFile}`);
  console.log(`Flutter file: ${conflict.flutterFile}`);
  console.log(`React timestamp: ${new Date(conflict.reactTimestamp)}`);
  console.log(`Flutter timestamp: ${new Date(conflict.flutterTimestamp)}`);
  
  // Handle conflict resolution
  // ... show UI to user, let them choose which version to keep
  
  // Mark as resolved
  sync.resolveConflict(conflict.id);
});

// Get unresolved conflicts
const conflicts = sync.getUnresolvedConflicts();
console.log(`Unresolved conflicts: ${conflicts.length}`);
```

### Advanced Configuration

```typescript
const sync = new BidirectionalSync({
  sync: {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
    storageDir: '.lumora/ir',
    reactToIR,
    flutterToIR,
    irToReact,
    irToFlutter,
  },
  watcher: {
    reactDir: 'web/src',
    flutterDir: 'mobile/lib',
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/build/**',
      '**/dist/**',
      '**/*.test.*',
      '**/*.spec.*',
    ],
    debounceMs: 100, // Wait 100ms after last change
  },
  queue: {
    batchSize: 10,        // Process up to 10 files at once
    batchDelayMs: 500,    // Wait 500ms before processing batch
    maxQueueSize: 100,    // Maximum queue size
  },
  conflictDetector: {
    conflictWindowMs: 5000, // 5 second window for conflict detection
    storageDir: '.lumora/ir',
  },
});
```

## Components

### FileWatcher

Monitors file system for changes using chokidar.

```typescript
import { FileWatcher } from '@lumora/ir';

const watcher = new FileWatcher({
  reactDir: 'web/src',
  flutterDir: 'mobile/lib',
  debounceMs: 100,
});

watcher.onChange((event) => {
  console.log(`${event.type}: ${event.filePath} (${event.framework})`);
});

watcher.start();
```

### ChangeQueue

Queues and batches file changes with priority-based processing.

```typescript
import { ChangeQueue, ChangePriority } from '@lumora/ir';

const queue = new ChangeQueue({
  batchSize: 10,
  batchDelayMs: 500,
});

queue.onProcess(async (changes) => {
  console.log(`Processing ${changes.length} changes`);
  for (const change of changes) {
    console.log(`- ${change.event.filePath} (priority: ${change.priority})`);
  }
});

queue.enqueue(fileChangeEvent);
```

### SyncEngine

Handles conversion between frameworks via IR.

```typescript
import { SyncEngine } from '@lumora/ir';

const engine = new SyncEngine({
  reactDir: 'web/src',
  flutterDir: 'mobile/lib',
  reactToIR,
  flutterToIR,
  irToReact,
  irToFlutter,
});

const results = await engine.processChanges(queuedChanges);
for (const result of results) {
  if (result.success) {
    console.log(`Synced: ${result.sourceFile} -> ${result.targetFile}`);
  } else {
    console.error(`Failed: ${result.sourceFile} - ${result.error}`);
  }
}
```

### ConflictDetector

Detects simultaneous changes to both React and Flutter versions.

```typescript
import { ConflictDetector } from '@lumora/ir';

const detector = new ConflictDetector({
  conflictWindowMs: 5000,
});

detector.onConflict((conflict) => {
  console.warn('Conflict detected:', conflict);
});

const result = detector.checkConflict(
  fileChangeEvent,
  irId,
  reactFile,
  flutterFile
);

if (result.hasConflict) {
  // Handle conflict
}
```

### SyncStatusTracker

Tracks sync operations and provides status reporting.

```typescript
import { SyncStatusTracker, SyncStatus } from '@lumora/ir';

const tracker = new SyncStatusTracker();

tracker.onStatusUpdate((event) => {
  console.log(event.status, event.message);
});

const opId = tracker.startOperation('src/App.tsx', 'react');
tracker.updateOperation(opId, { status: 'processing' });
tracker.completeOperation(opId, 'lib/app.dart');

// Display status
console.log(tracker.formatForCLI());

// Get statistics
const stats = tracker.getStatistics();
console.log(`Success rate: ${stats.successfulSyncs}/${stats.totalSyncs}`);
```

## Performance

The sync engine is designed for high performance:

- **File change detection**: < 100ms (configurable debounce)
- **Batch processing**: Processes multiple files in parallel
- **Priority queue**: High-priority files (main.tsx, app.dart) processed first
- **Deduplication**: Multiple changes to same file are collapsed
- **Conflict detection**: 5-second window (configurable)

## Error Handling

The sync engine handles errors gracefully:

- Parse errors are logged and reported via status tracker
- Failed syncs don't block other files
- Original files are never overwritten without successful conversion
- Conflicts are detected and require manual resolution

## Testing

```typescript
import { BidirectionalSync } from '@lumora/ir';

// Create mock converters for testing
const mockReactToIR = jest.fn();
const mockFlutterToIR = jest.fn();
const mockIRToReact = jest.fn();
const mockIRToFlutter = jest.fn();

const sync = new BidirectionalSync({
  sync: {
    reactDir: 'test/react',
    flutterDir: 'test/flutter',
    reactToIR: mockReactToIR,
    flutterToIR: mockFlutterToIR,
    irToReact: mockIRToReact,
    irToFlutter: mockIRToFlutter,
  },
});

// Test sync operations
sync.start();
// ... trigger file changes
await sync.stop();

// Verify converters were called
expect(mockReactToIR).toHaveBeenCalled();
```

## Integration with CLI

```typescript
// cli.ts
import { BidirectionalSync } from '@lumora/ir';
import chalk from 'chalk';

const sync = new BidirectionalSync(config);

// Display status in CLI
sync.onStatusUpdate((event) => {
  const statusColors = {
    idle: chalk.gray,
    watching: chalk.blue,
    syncing: chalk.yellow,
    error: chalk.red,
    conflict: chalk.magenta,
  };
  
  const color = statusColors[event.status];
  console.log(color(event.message || event.status));
});

// Display conflicts
sync.onConflict((conflict) => {
  console.log(chalk.red('⚠️  Conflict detected!'));
  console.log(chalk.yellow(`React: ${conflict.reactFile}`));
  console.log(chalk.yellow(`Flutter: ${conflict.flutterFile}`));
  console.log(chalk.gray('Run `lumora resolve` to resolve conflicts'));
});

sync.start();
console.log(chalk.green('✓ Bidirectional sync started'));
console.log(sync.getStatusTracker().formatForCLI());
```

## Best Practices

1. **Configure appropriate debounce times** - Too short causes excessive processing, too long delays updates
2. **Set reasonable batch sizes** - Balance between latency and throughput
3. **Handle conflicts promptly** - Don't let conflicts accumulate
4. **Monitor statistics** - Track success rates and average sync times
5. **Use priority queuing** - Ensure critical files are processed first
6. **Implement proper error handling** - Log errors and notify users
7. **Test with large projects** - Ensure performance scales

## Troubleshooting

### Sync is slow

- Reduce debounce time
- Increase batch size
- Check converter/generator performance
- Verify file system performance

### Too many conflicts

- Increase conflict window
- Coordinate team on which framework to edit
- Use development mode selection (react-first, flutter-first, or universal)

### Files not syncing

- Check file watcher configuration
- Verify ignored patterns
- Check converter/generator implementations
- Review error logs

### High memory usage

- Reduce max queue size
- Implement cleanup in converters/generators
- Check for memory leaks in handlers

