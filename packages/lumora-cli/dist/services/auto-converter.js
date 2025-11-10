"use strict";
/**
 * Auto-Converter Service
 * Watches files and automatically converts TSX → Schema → Push to Dev-Proxy
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoConverter = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
class AutoConverter {
    constructor(config) {
        this.watcher = null;
        this.debounceTimers = new Map();
        this.config = {
            debounceMs: 300,
            ...config,
        };
    }
    async start() {
        const watchPattern = path.join(this.config.watchDir, '**/*.{tsx,ts,jsx,js}');
        this.watcher = chokidar_1.default.watch(watchPattern, {
            ignoreInitial: true,
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/__tests__/**',
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
            ],
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50,
            },
        });
        this.watcher.on('change', (filePath) => {
            this.handleFileChange(filePath);
        });
        this.watcher.on('add', (filePath) => {
            this.handleFileChange(filePath);
        });
        this.watcher.on('error', (error) => {
            console.error(chalk_1.default.red('File watcher error:'), error);
        });
    }
    handleFileChange(filePath) {
        // Clear existing debounce timer
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new debounce timer
        const timer = setTimeout(async () => {
            await this.processFile(filePath);
            this.debounceTimers.delete(filePath);
        }, this.config.debounceMs);
        this.debounceTimers.set(filePath, timer);
    }
    async processFile(filePath) {
        const startTime = Date.now();
        const fileName = path.basename(filePath);
        const timestamp = new Date().toLocaleTimeString();
        try {
            console.log(chalk_1.default.blue(`[${timestamp}] 📝 File changed: ${fileName}`));
            // 1. Convert TSX to Schema
            const schema = await this.convertToSchema(filePath);
            console.log(chalk_1.default.gray(`  ✓ Schema generated`));
            // 2. Push to Dev-Proxy
            await this.pushToDevProxy(schema);
            const duration = Date.now() - startTime;
            console.log(chalk_1.default.green(`  ✓ Pushed to device`));
            console.log(chalk_1.default.cyan(`  ⚡ Update completed in ${duration}ms\n`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`));
        }
    }
    async convertToSchema(filePath) {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8');
        // Simple schema generation (in production, use proper TSX parser)
        // This is a simplified version - the real implementation would use
        // the tsx2schema tool from the codegen package
        const schema = {
            schemaVersion: '1.0',
            metadata: {
                sourceFile: filePath,
                generatedAt: Date.now(),
            },
            root: {
                type: 'Container',
                children: this.extractComponents(content),
            },
        };
        return schema;
    }
    extractComponents(content) {
        // Simplified component extraction
        // In production, this would use proper AST parsing
        const components = [];
        // Detect Text components
        const textMatches = content.matchAll(/<Text[^>]*>(.*?)<\/Text>/g);
        for (const match of textMatches) {
            components.push({
                type: 'Text',
                props: { text: match[1] },
            });
        }
        // Detect Button components
        const buttonMatches = content.matchAll(/<Button[^>]*>(.*?)<\/Button>/g);
        for (const match of buttonMatches) {
            components.push({
                type: 'Button',
                props: { text: match[1] },
            });
        }
        // If no components found, return a placeholder
        if (components.length === 0) {
            components.push({
                type: 'Text',
                props: { text: 'Loading...' },
            });
        }
        return components;
    }
    async pushToDevProxy(schema) {
        const url = new URL(`/send/${this.config.sessionId}`, this.config.devProxyUrl);
        const data = JSON.stringify(schema);
        return new Promise((resolve, reject) => {
            const options = {
                hostname: url.hostname,
                port: url.port || 3000,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
                timeout: 5000,
            };
            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);
                        if (response.success) {
                            resolve();
                        }
                        else {
                            reject(new Error('Failed to push schema to Dev-Proxy'));
                        }
                    }
                    catch (error) {
                        reject(new Error(`Invalid response from Dev-Proxy: ${error instanceof Error ? error.message : String(error)}`));
                    }
                });
            });
            req.on('error', (error) => {
                reject(new Error(`Dev-Proxy error: ${error.message}`));
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.write(data);
            req.end();
        });
    }
    async stop() {
        // Clear all debounce timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        // Close watcher
        if (this.watcher) {
            await this.watcher.close();
        }
    }
    isWatching() {
        return this.watcher !== null;
    }
}
exports.AutoConverter = AutoConverter;
//# sourceMappingURL=auto-converter.js.map