/**
 * Web Preview Server
 * Serves React UI at localhost:3000 with live updates
 * Works alongside Dev-Proxy for mobile
 */

import express, { Express, Request, Response } from 'express';
import { LumoraIR, BidirectionalConverter } from 'lumora-ir';
import chalk from 'chalk';

export interface WebPreviewServerConfig {
  port: number;
  mode: 'react' | 'flutter' | 'universal';
}

export class WebPreviewServer {
  private app: Express;
  private config: WebPreviewServerConfig;
  private converter: BidirectionalConverter;
  private currentIR: LumoraIR | null = null;
  private lastUpdate: number = Date.now();

  constructor(config: WebPreviewServerConfig) {
    this.config = config;
    this.converter = new BidirectionalConverter();
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.use(express.json());
    
    // Main preview page
    this.app.get('/', (req: Request, res: Response) => {
      res.send(this.generatePreviewPage());
    });
    
    // API: Get current status
    this.app.get('/api/status', (_req: Request, res: Response) => {
      res.json({ 
        hasIR: !!this.currentIR,
        nodes: this.currentIR?.nodes.length || 0,
        mode: this.config.mode,
        lastUpdate: this.lastUpdate
      });
    });
    
    // API: Update IR
    this.app.post('/api/update-ir', (req: Request, res: Response) => {
      this.currentIR = req.body as LumoraIR;
      res.json({ success: true });
    });
  }

  private generatePreviewPage(): string {
    // Generate React code from IR if available
    let reactCode = '';
    if (this.currentIR) {
      try {
        // Generate JavaScript (not TypeScript) for browser
        reactCode = this.converter.generateReact(this.currentIR, {
          useTypeScript: false, // Generate plain JavaScript
          useFunctionComponents: true,
          styleFormat: 'inline',
        });
        
        // Comprehensive TypeScript stripping for browser compatibility
        reactCode = reactCode
          // Remove import statements
          .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
          // Remove export keywords
          .replace(/^export\s+(const|function|class)\s+/gm, '$1 ')
          .replace(/^export\s+default\s+/gm, '')
          // Remove interface declarations (must be before type annotations)
          .replace(/interface\s+\w+\s*\{[^}]+\}\s*/gs, '')
          // Remove type aliases
          .replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '')
          // Remove React.FC type annotations
          .replace(/:\s*React\.FC<[^>]+>/g, '')
          // Remove generic type parameters
          .replace(/<[A-Z]\w+(?:Props|State)?>/g, '')
          // Remove function parameter type annotations (e.g., name: string)
          .replace(/(\w+)\s*:\s*\w+(\[\])?\s*([,)])/g, '$1$3')
          // Remove variable type annotations (e.g., const x: number = 5)
          .replace(/:\s*\w+(\[\])?\s*=/g, ' =')
          // Remove return type annotations (e.g., ): number {)
          .replace(/\)\s*:\s*\w+(\[\])?\s*\{/g, ') {')
          // Remove object type annotations
          .replace(/:\s*\{[^}]+\}/g, '')
          // Clean up any remaining standalone type annotations
          .replace(/:\s*\w+(\[\])?;/g, ';')
      } catch (error) {
        console.error('Error generating React code:', error);
      }
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Lumora Web Preview</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    #root { width: 100%; height: 100vh; }
    .loading { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      font-size: 18px; 
      color: #666; 
    }
    .error {
      padding: 20px;
      background: #fee;
      border-left: 4px solid #f00;
      margin: 20px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      ${this.currentIR ? '🚀 Loading your app...' : '⏳ Waiting for app code...'}
    </div>
  </div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    ${reactCode || `
    // Default component when no IR is loaded
    function App() {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 32, marginBottom: 20, color: '#667eea' }}>
            🚀 Lumora Web Preview
          </h1>
          <div style={{ 
            background: '#eff6ff', 
            borderLeft: '4px solid #3b82f6', 
            padding: 20, 
            borderRadius: 8,
            marginBottom: 20 
          }}>
            <p style={{ fontSize: 16, marginBottom: 10 }}>
              <strong>💡 Getting Started:</strong>
            </p>
            <ol style={{ marginLeft: 20, lineHeight: 1.8 }}>
              <li>Edit <code>src/App.tsx</code> in your project</li>
              <li>Save the file</li>
              <li>Watch this page update automatically!</li>
            </ol>
          </div>
          <div style={{ 
            background: '#f0fdf4', 
            borderLeft: '4px solid #10b981', 
            padding: 20, 
            borderRadius: 8,
            marginBottom: 20 
          }}>
            <p style={{ fontSize: 16, marginBottom: 10 }}>
              <strong>📱 Mobile Preview:</strong>
            </p>
            <p style={{ lineHeight: 1.6, color: '#666' }}>
              For the full native experience, scan the QR code in your terminal 
              with the Lumora Dev Client app to see your app running on a real device!
            </p>
          </div>
          <p style={{ color: '#999', fontSize: 14 }}>
            Mode: ${this.config.mode.toUpperCase()} • Port: ${this.config.port}
          </p>
        </div>
      );
    }
    `}

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    
    try {
      root.render(<App />);
    } catch (error) {
      root.render(
        <div className="error">
          <h2>Error rendering app</h2>
          <pre>{error.toString()}</pre>
        </div>
      );
    }

    // Auto-refresh on updates
    let lastUpdate = Date.now();
    setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.hasIR && data.lastUpdate > lastUpdate) {
          lastUpdate = data.lastUpdate;
          window.location.reload();
        }
      } catch (err) {
        console.error('Status check failed:', err);
      }
    }, 1000);
  </script>
</body>
</html>
    `;
  }

  updateIR(ir: LumoraIR) {
    this.currentIR = ir;
    this.lastUpdate = Date.now();
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(chalk.green(`✓ Web preview at http://localhost:${this.config.port}`));
        resolve();
      });
    });
  }
}
