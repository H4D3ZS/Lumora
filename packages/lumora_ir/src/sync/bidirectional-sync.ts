import { FileWatcher, FileWatcherConfig, FileChangeEvent } from './file-watcher';
import { ChangeQueue, ChangeQueueConfig, QueuedChange } from './change-queue';
import { SyncEngine, SyncConfig, SyncResult } from './sync-engine';
import { ConflictDetector, ConflictDetectorConfig, ConflictRecord } from './conflict-detector';
import { SyncStatusTracker, SyncStatus, StatusUpdateEvent } from './sync-status';

/**
 * Bidirectional sync configuration
 */
export interface BidirectionalSyncConfig {
  sync: SyncConfig;
  watcher?: FileWatcherConfig;
  queue?: ChangeQueueConfig;
  conflictDetector?: ConflictDetectorConfig;
}

/**
 * Bidirectional Sync Coordinator
 * Orchestrates file watching, change queuing, sync, and conflict detection
 */
export class BidirectionalSync {
  private fileWatcher: FileWatcher;
  private changeQueue: ChangeQueue;
  private syncEngine: SyncEngine;
  private conflictDetector: ConflictDetector;
  private statusTracker: SyncStatusTracker;
  private config: BidirectionalSyncConfig;
  private running = false;

  constructor(config: BidirectionalSyncConfig) {
    this.config = config;

    // Initialize components
    this.fileWatcher = new FileWatcher({
      reactDir: config.sync.reactDir,
      flutterDir: config.sync.flutterDir,
      ...config.watcher,
    });

    this.changeQueue = new ChangeQueue(config.queue);
    this.syncEngine = new SyncEngine(config.sync);
    this.conflictDetector = new ConflictDetector(config.conflictDetector);
    this.statusTracker = new SyncStatusTracker();

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // File watcher -> Change queue
    this.fileWatcher.onChange((event) => {
      this.changeQueue.enqueue(event);
    });

    // Change queue -> Sync engine
    this.changeQueue.onProcess(async (changes) => {
      await this.processChanges(changes);
    });

    // Conflict detector -> Status tracker
    this.conflictDetector.onConflict((conflict) => {
      this.statusTracker.recordConflict();
      console.warn('Conflict detected:', conflict);
    });
  }

  /**
   * Start bidirectional sync
   */
  start(): void {
    if (this.running) {
      console.warn('Bidirectional sync is already running');
      return;
    }

    this.running = true;
    this.fileWatcher.start();
    this.statusTracker.setStatus(SyncStatus.WATCHING, 'Watching for changes...');
    
    console.log('Bidirectional sync started');
    console.log(`Watching React: ${this.config.sync.reactDir}`);
    console.log(`Watching Flutter: ${this.config.sync.flutterDir}`);
  }

  /**
   * Stop bidirectional sync
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    
    // Flush pending changes
    await this.changeQueue.flush();
    
    // Stop file watcher
    await this.fileWatcher.stop();
    
    this.statusTracker.setStatus(SyncStatus.IDLE, 'Stopped');
    console.log('Bidirectional sync stopped');
  }

  /**
   * Process changes from queue
   */
  private async processChanges(changes: QueuedChange[]): Promise<void> {
    for (const change of changes) {
      const opId = this.statusTracker.startOperation(
        change.event.filePath,
        change.event.framework
      );

      try {
        this.statusTracker.updateOperation(opId, { status: 'processing' });

        // Check for conflicts
        const irId = this.generateIRId(change.event);
        const { reactFile, flutterFile } = this.getFilePaths(change.event);
        
        const conflictResult = this.conflictDetector.checkConflict(
          change.event,
          irId,
          reactFile,
          flutterFile
        );

        if (conflictResult.hasConflict) {
          // Skip sync if conflict detected
          this.statusTracker.completeOperation(
            opId,
            undefined,
            'Conflict detected - manual resolution required'
          );
          continue;
        }

        // Process sync
        const results = await this.syncEngine.processChanges([change]);
        const result = results[0];

        if (result.success) {
          this.statusTracker.completeOperation(opId, result.targetFile);
        } else {
          this.statusTracker.completeOperation(opId, undefined, result.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.statusTracker.completeOperation(opId, undefined, errorMsg);
        console.error('Error processing change:', error);
      }
    }
  }

  /**
   * Generate IR ID from event
   */
  private generateIRId(event: FileChangeEvent): string {
    const baseDir = event.framework === 'react' 
      ? this.config.sync.reactDir 
      : this.config.sync.flutterDir;
    
    const relativePath = event.filePath.replace(baseDir, '');
    const withoutExt = relativePath.replace(/\.(tsx?|jsx?|dart)$/, '');
    const normalized = withoutExt.replace(/[\/\\]/g, '_');
    
    return `${event.framework}_${normalized}`;
  }

  /**
   * Get React and Flutter file paths
   */
  private getFilePaths(event: FileChangeEvent): { reactFile: string; flutterFile: string } {
    if (event.framework === 'react') {
      return {
        reactFile: event.filePath,
        flutterFile: this.getTargetPath(event.filePath, 'react'),
      };
    } else {
      return {
        reactFile: this.getTargetPath(event.filePath, 'flutter'),
        flutterFile: event.filePath,
      };
    }
  }

  /**
   * Get target file path (simplified version)
   */
  private getTargetPath(sourceFile: string, sourceFramework: 'react' | 'flutter'): string {
    // This is a simplified version - actual implementation in SyncEngine
    if (sourceFramework === 'react') {
      return sourceFile
        .replace(this.config.sync.reactDir, this.config.sync.flutterDir)
        .replace(/\.(tsx?|jsx?)$/, '.dart');
    } else {
      return sourceFile
        .replace(this.config.sync.flutterDir, this.config.sync.reactDir)
        .replace(/\.dart$/, '.tsx');
    }
  }

  /**
   * Get status tracker
   */
  getStatusTracker(): SyncStatusTracker {
    return this.statusTracker;
  }

  /**
   * Get conflict detector
   */
  getConflictDetector(): ConflictDetector {
    return this.conflictDetector;
  }

  /**
   * Get sync engine
   */
  getSyncEngine(): SyncEngine {
    return this.syncEngine;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts(): ConflictRecord[] {
    return this.conflictDetector.getUnresolvedConflicts();
  }

  /**
   * Resolve conflict
   */
  resolveConflict(conflictId: string): boolean {
    return this.conflictDetector.resolveConflict(conflictId);
  }

  /**
   * Register status update handler
   */
  onStatusUpdate(handler: (event: StatusUpdateEvent) => void): void {
    this.statusTracker.onStatusUpdate(handler);
  }

  /**
   * Register conflict handler
   */
  onConflict(handler: (conflict: ConflictRecord) => void): void {
    this.conflictDetector.onConflict(handler);
  }
}

