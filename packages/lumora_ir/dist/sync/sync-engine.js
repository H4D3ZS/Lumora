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
/**
 * Sync Engine
 * Handles conversion and synchronization between React and Flutter
 */
class SyncEngine {
    constructor(config) {
        this.config = config;
        this.storage = new ir_storage_1.IRStorage(config.storageDir || '.lumora/ir');
    }
    /**
     * Process changes from queue
     */
    async processChanges(changes) {
        const results = [];
        for (const change of changes) {
            try {
                const result = await this.processChange(change);
                results.push(result);
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
    /**
     * Process single change
     */
    async processChange(change) {
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
    async convertToIR(filePath, framework) {
        if (framework === 'react') {
            if (!this.config.reactToIR) {
                throw new Error('React to IR converter not configured');
            }
            return await this.config.reactToIR(filePath);
        }
        else {
            if (!this.config.flutterToIR) {
                throw new Error('Flutter to IR converter not configured');
            }
            return await this.config.flutterToIR(filePath);
        }
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
}
exports.SyncEngine = SyncEngine;
