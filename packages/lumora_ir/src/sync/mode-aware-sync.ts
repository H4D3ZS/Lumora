import { ModeAwareWatcher, createModeAwareWatcher } from './mode-aware-watcher';
import { ChangeQueue, ChangeQueueConfig, QueuedChange } from './change-queue';
import { SyncEngine, SyncConfig, SyncResult } from './sync-engine';
import { ConflictDetector, ConflictDetectorConfig, ConflictRecord } from './conflict-detector';
import { SyncStatusTracker, SyncStatus, StatusUpdateEvent } from './sync-status';
import { ModeConfig, DevelopmentMode } from '../config/mode-config';
import { FileChangeEvent } from './file-watcher';

/**
 * Mode-aware sync configuration
 */
export interface ModeAwareSyncConfig {
  modeConfig: ModeConfig;
  sync: Omit<SyncConfig, 'reactDir' | 'flutterDir'>;
  queue?: ChangeQueueConfig;
  conflictDetector?: ConflictDetectorConfig;
}

/**
 * Mode-Aware Bidirectional Sync
 * Orchestrates file watching, change queuing, sync, and conflict detection
 * with mode-aware behavior
 */
export class ModeAwareSync {
  private modeWatcher: ModeAwareWatcher;
  private changeQueue: ChangeQueue;
  private syncEngine: SyncEngine;
  private conflictDetector: ConflictDetector;
  private statusTracker: SyncStatusTracker;
  private modeConfig: ModeConfig;
  private config: ModeAwareSyncConfig;
  private running = false;

  constructor(config: ModeAwareSyncConfig) {
    this.config = config;
    this.modeConfig = config.modeConfig;

    // Initialize mode-aware watcher
    this.modeWatcher = createModeAwareWatcher(config.modeConfig);

    // Initialize components
    this.changeQueue = new ChangeQueue(config.queue);
    
    this.syncEngine = new SyncEngine({
      reactDir: config.modeConfig.getReactDir(),
      flutterDir: config.modeConfig.getFlutterDir(),
      storageDir: config.modeConfig.getStorageDir(),
      ...config.sync,
    });

    // Configure conflict detector based on mode
    const conflictConfig = this.buildConflictDetectorConfig(config.conflictDetector);
    this.conflictDetector = new ConflictDetector(conflictConfig);
    
    this.statusTracker = new SyncStatusTracker();

    // Wire up event handlers
    this.setupEventHandlers();
  }

  /**
   * Build conflict detector configuration based on mode
   */
  private buildConflictDetectorConfig(
    baseConfig?: ConflictDetectorConfig
  ): ConflictDetectorConfig {
    const mode = this.modeConfig.getMode();

    // In React/Flutter mode, conflicts should not occur since only one side is editable
    // In Universal mode, conflicts can occur
    const enableConflictDetection = mode === DevelopmentMode.UNIVERSAL;

    return {
      ...baseConfig,
      // Override conflict window if in single-source mode
      conflictWindowMs: enableConflictDetection 
        ? (baseConfig?.conflictWindowMs || 5000)
        : 0, // No conflict detection in single-source mode
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Mode-aware watcher -> Change queue
    this.modeWatcher.onChange((event) => {
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
   * Start mode-aware sync
   */
  start(): void {
    if (this.running) {
      console.warn('Mode-aware sync is already running');
      return;
    }

    this.running = true;
    this.modeWatcher.start();
    this.statusTracker.setStatus(SyncStatus.WATCHING, 'Watching for changes...');
    
    console.log('Mode-aware sync started');
    console.log(`Mode: ${this.modeConfig.getMode()}`);
    console.log(this.modeWatcher.getModeDescription());
  }

  /**
   * Stop mode-aware sync
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    
    // Flush pending changes
    await this.changeQueue.flush();
    
    // Stop watcher
    await this.modeWatcher.stop();
    
    this.statusTracker.setStatus(SyncStatus.IDLE, 'Stopped');
    console.log('Mode-aware sync stopped');
  }

  /**
   * Process changes from queue
   */
  private async processChanges(changes: QueuedChange[]): Promise<void> {
    const mode = this.modeConfig.getMode();

    for (const change of changes) {
      const opId = this.statusTracker.startOperation(
        change.event.filePath,
        change.event.framework
      );

      try {
        this.statusTracker.updateOperation(opId, { status: 'processing' });

        // Check if this change should be processed based on mode
        if (!this.shouldProcessChange(change.event)) {
          this.statusTracker.completeOperation(
            opId,
            undefined,
            'Skipped: file is read-only in current mode'
          );
          continue;
        }

        // Check for conflicts (only in Universal mode)
        if (mode === DevelopmentMode.UNIVERSAL) {
          const irId = this.generateIRId(change.event);
          const { reactFile, flutterFile } = this.getFilePaths(change.event);
          
          const conflictResult = this.conflictDetector.checkConflict(
            change.event,
            irId,
            reactFile,
            flutterFile
          );

          if (conflictResult.hasConflict) {
            this.statusTracker.completeOperation(
              opId,
              undefined,
              'Conflict detected - manual resolution required'
            );
            continue;
          }
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
   * Check if change should be processed based on mode
   */
  private shouldProcessChange(event: FileChangeEvent): boolean {
    // Check if the file is read-only in current mode
    if (this.modeWatcher.isReadOnly(event.framework)) {
      console.warn(
        `Ignoring change to ${event.framework} file in ${this.modeConfig.getMode()} mode: ${event.filePath}`
      );
      return false;
    }

    return true;
  }

  /**
   * Generate IR ID from event
   */
  private generateIRId(event: FileChangeEvent): string {
    const baseDir = event.framework === 'react' 
      ? this.modeConfig.getReactDir()
      : this.modeConfig.getFlutterDir();
    
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
    const reactDir = this.modeConfig.getReactDir();
    const flutterDir = this.modeConfig.getFlutterDir();

    if (sourceFramework === 'react') {
      return sourceFile
        .replace(reactDir, flutterDir)
        .replace(/\.(tsx?|jsx?)$/, '.dart');
    } else {
      return sourceFile
        .replace(flutterDir, reactDir)
        .replace(/\.dart$/, '.tsx');
    }
  }

  /**
   * Get mode configuration
   */
  getModeConfig(): ModeConfig {
    return this.modeConfig;
  }

  /**
   * Get development mode
   */
  getMode(): DevelopmentMode {
    return this.modeConfig.getMode();
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

  /**
   * Get mode-aware watcher
   */
  getModeWatcher(): ModeAwareWatcher {
    return this.modeWatcher;
  }
}

/**
 * Create mode-aware sync from mode configuration
 */
export function createModeAwareSync(config: ModeAwareSyncConfig): ModeAwareSync {
  return new ModeAwareSync(config);
}
