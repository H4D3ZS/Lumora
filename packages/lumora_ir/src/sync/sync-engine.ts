import * as fs from 'fs';
import * as path from 'path';
import { LumoraIR } from '../types/ir-types';
import { IRStorage } from '../storage/ir-storage';
import { QueuedChange } from './change-queue';
import { ConversionCache, getConversionCache } from '../cache/conversion-cache';
import { ParallelProcessor, getParallelProcessor } from '../workers/parallel-processor';
import { ProgressTracker, getProgressTracker } from '../progress/progress-tracker';
import { TestSyncHandler, TestSyncConfig } from './test-sync-handler';

/**
 * Converter function type
 */
export type ConverterFunction = (filePath: string) => Promise<LumoraIR>;

/**
 * Generator function type
 */
export type GeneratorFunction = (ir: LumoraIR, outputPath: string) => Promise<void>;

/**
 * Sync configuration
 */
export interface SyncConfig {
  reactDir: string;
  flutterDir: string;
  storageDir?: string;
  reactToIR?: ConverterFunction;
  flutterToIR?: ConverterFunction;
  irToReact?: GeneratorFunction;
  irToFlutter?: GeneratorFunction;
  enableParallelProcessing?: boolean;
  parallelThreshold?: number;
  testSync?: Partial<TestSyncConfig>;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  sourceFile: string;
  targetFile?: string;
  irId?: string;
  error?: string;
}

/**
 * Sync Engine
 * Handles conversion and synchronization between React and Flutter
 */
export class SyncEngine {
  private config: SyncConfig;
  private storage: IRStorage;
  private cache: ConversionCache;
  private processor: ParallelProcessor;
  private progress: ProgressTracker;
  private testSyncHandler: TestSyncHandler;
  private enableParallel: boolean;
  private parallelThreshold: number;

  constructor(config: SyncConfig) {
    this.config = config;
    this.storage = new IRStorage(config.storageDir || '.lumora/ir');
    this.cache = getConversionCache();
    this.processor = getParallelProcessor();
    this.progress = getProgressTracker();
    this.testSyncHandler = new TestSyncHandler(config.testSync);
    this.enableParallel = config.enableParallelProcessing ?? true;
    this.parallelThreshold = config.parallelThreshold ?? 3;
  }

  /**
   * Process changes from queue
   */
  async processChanges(changes: QueuedChange[]): Promise<SyncResult[]> {
    // Start progress tracking for large batches
    const operationId = `sync-${Date.now()}`;
    if (changes.length > 2) {
      this.progress.start(operationId, changes.length, 'Processing changes...');
    }

    try {
      // Use parallel processing for multiple changes
      if (this.enableParallel && changes.length >= this.parallelThreshold) {
        return await this.processChangesParallel(changes, operationId);
      }

      // Sequential processing for small batches
      const results: SyncResult[] = [];

      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        try {
          const result = await this.processChange(change);
          results.push(result);
          
          if (changes.length > 2) {
            this.progress.update(operationId, i + 1, `Processing ${path.basename(change.event.filePath)}`);
          }
        } catch (error) {
          results.push({
            success: false,
            sourceFile: change.event.filePath,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return results;
    } finally {
      if (changes.length > 2) {
        this.progress.complete(operationId, 'Processing complete');
      }
    }
  }

  /**
   * Process changes in parallel
   */
  private async processChangesParallel(changes: QueuedChange[], operationId: string): Promise<SyncResult[]> {
    let completed = 0;
    
    const promises = changes.map(async (change) => {
      try {
        const result = await this.processChange(change);
        completed++;
        this.progress.update(operationId, completed, `Processing ${path.basename(change.event.filePath)}`);
        return result;
      } catch (error) {
        completed++;
        this.progress.update(operationId, completed);
        return {
          success: false,
          sourceFile: change.event.filePath,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Process single change
   */
  private async processChange(change: QueuedChange): Promise<SyncResult> {
    const { event } = change;

    // Handle file deletion
    if (event.type === 'unlink') {
      return this.handleFileDeletion(event.filePath, event.framework);
    }

    // Check if this is a test file
    if (this.testSyncHandler.isTestFile(event.filePath)) {
      return this.processTestFile(event.filePath, event.framework);
    }

    // Convert file to IR
    const ir = await this.convertToIR(event.filePath, event.framework);

    // Generate IR ID from file path
    const irId = this.generateIRId(event.filePath, event.framework);

    // Check if IR has changed
    if (!this.storage.hasChanged(irId, ir)) {
      return {
        success: true,
        sourceFile: event.filePath,
        irId,
      };
    }

    // Store IR
    this.storage.store(irId, ir);

    // Generate target framework file
    const targetFile = await this.generateTargetFile(ir, event.framework, event.filePath);

    return {
      success: true,
      sourceFile: event.filePath,
      targetFile,
      irId,
    };
  }

  /**
   * Process test file
   */
  private async processTestFile(
    filePath: string,
    framework: 'react' | 'flutter'
  ): Promise<SyncResult> {
    try {
      const targetPath = this.testSyncHandler.getTargetTestPath(
        filePath,
        framework,
        this.config.reactDir,
        this.config.flutterDir
      );

      const result = await this.testSyncHandler.convertTestFile(
        filePath,
        targetPath,
        framework
      );

      if (result.success) {
        if (result.stubGenerated) {
          console.log(`⚠️  Test stub generated: ${result.targetFile} (manual conversion required)`);
        } else {
          console.log(`✓ Test converted: ${result.targetFile}`);
        }
      }

      return {
        success: result.success,
        sourceFile: result.sourceFile,
        targetFile: result.targetFile,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        sourceFile: filePath,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert file to IR
   */
  private async convertToIR(filePath: string, framework: 'react' | 'flutter'): Promise<LumoraIR> {
    // Check cache first
    const cachedIR = this.cache.getIR(filePath);
    if (cachedIR) {
      return cachedIR;
    }

    // Convert file
    let ir: LumoraIR;
    if (framework === 'react') {
      if (!this.config.reactToIR) {
        throw new Error('React to IR converter not configured');
      }
      ir = await this.config.reactToIR(filePath);
    } else {
      if (!this.config.flutterToIR) {
        throw new Error('Flutter to IR converter not configured');
      }
      ir = await this.config.flutterToIR(filePath);
    }

    // Cache the result
    this.cache.setIR(filePath, ir);
    return ir;
  }

  /**
   * Generate target framework file
   */
  private async generateTargetFile(
    ir: LumoraIR,
    sourceFramework: 'react' | 'flutter',
    sourceFile: string
  ): Promise<string> {
    const targetFramework = sourceFramework === 'react' ? 'flutter' : 'react';
    const targetPath = this.getTargetPath(sourceFile, sourceFramework);

    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate target file
    if (targetFramework === 'react') {
      if (!this.config.irToReact) {
        throw new Error('IR to React generator not configured');
      }
      await this.config.irToReact(ir, targetPath);
    } else {
      if (!this.config.irToFlutter) {
        throw new Error('IR to Flutter generator not configured');
      }
      await this.config.irToFlutter(ir, targetPath);
    }

    return targetPath;
  }

  /**
   * Get target file path
   */
  private getTargetPath(sourceFile: string, sourceFramework: 'react' | 'flutter'): string {
    if (sourceFramework === 'react') {
      // React to Flutter: web/src/Component.tsx -> mobile/lib/component.dart
      const relativePath = path.relative(this.config.reactDir, sourceFile);
      const baseName = path.basename(relativePath, path.extname(relativePath));
      const dirName = path.dirname(relativePath);
      
      // Convert to snake_case for Dart
      const dartName = this.toSnakeCase(baseName) + '.dart';
      
      return path.join(this.config.flutterDir, dirName, dartName);
    } else {
      // Flutter to React: mobile/lib/component.dart -> web/src/Component.tsx
      const relativePath = path.relative(this.config.flutterDir, sourceFile);
      const baseName = path.basename(relativePath, '.dart');
      const dirName = path.dirname(relativePath);
      
      // Convert to PascalCase for React
      const reactName = this.toPascalCase(baseName) + '.tsx';
      
      return path.join(this.config.reactDir, dirName, reactName);
    }
  }

  /**
   * Handle file deletion
   */
  private async handleFileDeletion(
    filePath: string,
    framework: 'react' | 'flutter'
  ): Promise<SyncResult> {
    const irId = this.generateIRId(filePath, framework);
    
    // Invalidate cache
    this.cache.invalidate(filePath);
    
    // Delete IR
    this.storage.delete(irId);

    // Delete target file
    const targetPath = this.getTargetPath(filePath, framework);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    return {
      success: true,
      sourceFile: filePath,
      targetFile: targetPath,
      irId,
    };
  }

  /**
   * Generate IR ID from file path
   */
  private generateIRId(filePath: string, framework: 'react' | 'flutter'): string {
    const baseDir = framework === 'react' ? this.config.reactDir : this.config.flutterDir;
    const relativePath = path.relative(baseDir, filePath);
    
    // Remove extension and normalize path
    const withoutExt = relativePath.replace(/\.(tsx?|jsx?|dart)$/, '');
    const normalized = withoutExt.replace(/[\/\\]/g, '_');
    
    return `${framework}_${normalized}`;
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Get IR storage
   */
  getStorage(): IRStorage {
    return this.storage;
  }

  /**
   * Get conversion cache
   */
  getCache(): ConversionCache {
    return this.cache;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get parallel processor
   */
  getProcessor(): ParallelProcessor {
    return this.processor;
  }

  /**
   * Enable parallel processing
   */
  enableParallelProcessing(): void {
    this.enableParallel = true;
  }

  /**
   * Disable parallel processing
   */
  disableParallelProcessing(): void {
    this.enableParallel = false;
  }

  /**
   * Check if parallel processing is enabled
   */
  isParallelProcessingEnabled(): boolean {
    return this.enableParallel;
  }

  /**
   * Get progress tracker
   */
  getProgressTracker(): ProgressTracker {
    return this.progress;
  }

  /**
   * Get test sync handler
   */
  getTestSyncHandler(): TestSyncHandler {
    return this.testSyncHandler;
  }

  /**
   * Enable test sync
   */
  enableTestSync(): void {
    this.testSyncHandler.enable();
  }

  /**
   * Disable test sync
   */
  disableTestSync(): void {
    this.testSyncHandler.disable();
  }

  /**
   * Check if test sync is enabled
   */
  isTestSyncEnabled(): boolean {
    return this.testSyncHandler.isEnabled();
  }
}

