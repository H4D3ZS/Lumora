/**
 * Auto-Converter Service
 * Watches files and automatically converts TSX → Schema → Push to Dev-Proxy
 */

import chokidar, { FSWatcher } from 'chokidar';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

export interface AutoConverterConfig {
  watchDir: string;
  devProxyUrl: string;
  sessionId: string;
  debounceMs?: number;
}

export class AutoConverter {
  private watcher: FSWatcher | null = null;
  private config: AutoConverterConfig;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AutoConverterConfig) {
    this.config = {
      debounceMs: 300,
      ...config,
    };
  }

  async start(): Promise<void> {
    const watchPattern = path.join(this.config.watchDir, '**/*.{tsx,ts,jsx,js}');
    
    this.watcher = chokidar.watch(watchPattern, {
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
      console.error(chalk.red('File watcher error:'), error);
    });
  }

  private handleFileChange(filePath: string) {
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

  private async processFile(filePath: string) {
    const startTime = Date.now();
    const fileName = path.basename(filePath);
    const timestamp = new Date().toLocaleTimeString();

    try {
      console.log(chalk.blue(`[${timestamp}] 📝 File changed: ${fileName}`));

      // 1. Convert TSX to Schema
      const schema = await this.convertToSchema(filePath);
      console.log(chalk.gray(`  ✓ Schema generated`));

      // 2. Push to Dev-Proxy
      await this.pushToDevProxy(schema);
      
      const duration = Date.now() - startTime;
      console.log(chalk.green(`  ✓ Pushed to device`));
      console.log(chalk.cyan(`  ⚡ Update completed in ${duration}ms\n`));

    } catch (error) {
      console.error(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    }
  }

  private async convertToSchema(filePath: string): Promise<any> {
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

  private extractComponents(content: string): any[] {
    // Simplified component extraction
    // In production, this would use proper AST parsing
    const components: any[] = [];

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

  private async pushToDevProxy(schema: any): Promise<void> {
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
            } else {
              reject(new Error('Failed to push schema to Dev-Proxy'));
            }
          } catch (error: unknown) {
            reject(new Error(`Invalid response from Dev-Proxy: ${error instanceof Error ? error.message : String(error)}`));
          }
        });
      });

      req.on('error', (error: Error) => {
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

  async stop(): Promise<void> {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      await this.watcher.close();
    }
  }

  isWatching(): boolean {
    return this.watcher !== null;
  }
}
