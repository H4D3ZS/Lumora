import * as fs from 'fs';
import * as path from 'path';
import { LumoraIR } from '../types/ir-types';
import { IRStorage } from '../storage/ir-storage';
import { QueuedChange } from './change-queue';

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

  constructor(config: SyncConfig) {
    this.config = config;
    this.storage = new IRStorage(config.storageDir || '.lumora/ir');
  }

  /**
   * Process changes from queue
   */
  async processChanges(changes: QueuedChange[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const change of changes) {
      try {
        const result = await this.processChange(change);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          sourceFile: change.event.filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
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
   * Convert file to IR
   */
  private async convertToIR(filePath: string, framework: 'react' | 'flutter'): Promise<LumoraIR> {
    if (framework === 'react') {
      if (!this.config.reactToIR) {
        throw new Error('React to IR converter not configured');
      }
      return await this.config.reactToIR(filePath);
    } else {
      if (!this.config.flutterToIR) {
        throw new Error('Flutter to IR converter not configured');
      }
      return await this.config.flutterToIR(filePath);
    }
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
}

