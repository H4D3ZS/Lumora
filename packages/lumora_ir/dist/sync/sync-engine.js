"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ir_storage_1 = require("../storage/ir-storage");
const conversion_cache_1 = require("../cache/conversion-cache");
const parallel_processor_1 = require("../workers/parallel-processor");
const progress_tracker_1 = require("../progress/progress-tracker");
const test_sync_handler_1 = require("./test-sync-handler");
/**
 * Sync Engine
 * Handles conversion and synchronization between React and Flutter
 */
class SyncEngine {
    constructor(config) {
        this.config = config;
        this.storage = new ir_storage_1.IRStorage(config.storageDir || '.lumora/ir');
        this.cache = (0, conversion_cache_1.getConversionCache)();
        this.processor = (0, parallel_processor_1.getParallelProcessor)();
        this.progress = (0, progress_tracker_1.getProgressTracker)();
        this.testSyncHandler = new test_sync_handler_1.TestSyncHandler(config.testSync);
        this.enableParallel = config.enableParallelProcessing ?? true;
        this.parallelThreshold = config.parallelThreshold ?? 3;
    }
    /**
     * Process changes from queue
     */
    async processChanges(changes) {
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
            const results = [];
            for (let i = 0; i < changes.length; i++) {
                const change = changes[i];
                try {
                    const result = await this.processChange(change);
                    results.push(result);
                    if (changes.length > 2) {
                        this.progress.update(operationId, i + 1, `Processing ${path.basename(change.event.filePath)}`);
                    }
                }
                catch (error) {
                    results.push({
                        success: false,
                        sourceFile: change.event.filePath,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            return results;
        }
        finally {
            if (changes.length > 2) {
                this.progress.complete(operationId, 'Processing complete');
            }
        }
    }
    /**
     * Process changes in parallel
     */
    async processChangesParallel(changes, operationId) {
        let completed = 0;
        const promises = changes.map(async (change) => {
            try {
                const result = await this.processChange(change);
                completed++;
                this.progress.update(operationId, completed, `Processing ${path.basename(change.event.filePath)}`);
                return result;
            }
            catch (error) {
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
    async processChange(change) {
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
    async processTestFile(filePath, framework) {
        try {
            const targetPath = this.testSyncHandler.getTargetTestPath(filePath, framework, this.config.reactDir, this.config.flutterDir);
            const result = await this.testSyncHandler.convertTestFile(filePath, targetPath, framework);
            if (result.success) {
                if (result.stubGenerated) {
                    console.log(`⚠️  Test stub generated: ${result.targetFile} (manual conversion required)`);
                }
                else {
                    console.log(`✓ Test converted: ${result.targetFile}`);
                }
            }
            return {
                success: result.success,
                sourceFile: result.sourceFile,
                targetFile: result.targetFile,
                error: result.error,
            };
        }
        catch (error) {
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
    async convertToIR(filePath, framework) {
        // Check cache first
        const cachedIR = this.cache.getIR(filePath);
        if (cachedIR) {
            return cachedIR;
        }
        // Convert file
        let ir;
        if (framework === 'react') {
            if (!this.config.reactToIR) {
                throw new Error('React to IR converter not configured');
            }
            ir = await this.config.reactToIR(filePath);
        }
        else {
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
    async generateTargetFile(ir, sourceFramework, sourceFile) {
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
        }
        else {
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
    getTargetPath(sourceFile, sourceFramework) {
        if (sourceFramework === 'react') {
            // React to Flutter: web/src/Component.tsx -> mobile/lib/component.dart
            const relativePath = path.relative(this.config.reactDir, sourceFile);
            const baseName = path.basename(relativePath, path.extname(relativePath));
            const dirName = path.dirname(relativePath);
            // Convert to snake_case for Dart
            const dartName = this.toSnakeCase(baseName) + '.dart';
            return path.join(this.config.flutterDir, dirName, dartName);
        }
        else {
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
    async handleFileDeletion(filePath, framework) {
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
    generateIRId(filePath, framework) {
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
    toSnakeCase(str) {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }
    /**
     * Convert string to PascalCase
     */
    toPascalCase(str) {
        return str
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    /**
     * Get IR storage
     */
    getStorage() {
        return this.storage;
    }
    /**
     * Get conversion cache
     */
    getCache() {
        return this.cache;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get parallel processor
     */
    getProcessor() {
        return this.processor;
    }
    /**
     * Enable parallel processing
     */
    enableParallelProcessing() {
        this.enableParallel = true;
    }
    /**
     * Disable parallel processing
     */
    disableParallelProcessing() {
        this.enableParallel = false;
    }
    /**
     * Check if parallel processing is enabled
     */
    isParallelProcessingEnabled() {
        return this.enableParallel;
    }
    /**
     * Get progress tracker
     */
    getProgressTracker() {
        return this.progress;
    }
    /**
     * Get test sync handler
     */
    getTestSyncHandler() {
        return this.testSyncHandler;
    }
    /**
     * Enable test sync
     */
    enableTestSync() {
        this.testSyncHandler.enable();
    }
    /**
     * Disable test sync
     */
    disableTestSync() {
        this.testSyncHandler.disable();
    }
    /**
     * Check if test sync is enabled
     */
    isTestSyncEnabled() {
        return this.testSyncHandler.isEnabled();
    }
}
exports.SyncEngine = SyncEngine;
