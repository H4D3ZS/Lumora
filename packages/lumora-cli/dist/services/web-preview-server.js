"use strict";
/**
 * Web Preview Server
 * Serves React UI at localhost:3000 with live updates
 * Works alongside Dev-Proxy for mobile
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPreviewServer = void 0;
const express_1 = __importDefault(require("express"));
const lumora_ir_1 = require("lumora-ir");
const chalk_1 = __importDefault(require("chalk"));
class WebPreviewServer {
    constructor(config) {
        this.currentIR = null;
        this.config = config;
        this.converter = new lumora_ir_1.BidirectionalConverter();
        this.app = (0, express_1.default)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.app.use(express_1.default.json());
        // Main preview page
        this.app.get('/', (req, res) => {
            res.send(this.generatePreviewPage());
        });
        // API: Get current React code
        this.app.get('/api/react-code', (req, res) => {
            if (!this.currentIR) {
                return res.json({ code: '// Waiting for code...' });
            }
            try {
                const reactCode = this.converter.generateReact(this.currentIR);
                res.json({ code: reactCode });
            }
            catch (error) {
                res.status(500).json({ error: String(error) });
            }
        });
        // API: Update IR
        this.app.post('/api/update-ir', (req, res) => {
            this.currentIR = req.body;
            res.json({ success: true });
        });
    }
    generatePreviewPage() {
        return `
<!DOCTYPE html>
<html>
<head>
  <title>Lumora Live Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header h1 { font-size: 20px; margin-bottom: 5px; }
    .header p { font-size: 12px; opacity: 0.9; }
    .status { display: inline-block; padding: 3px 10px; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 11px; margin-left: 10px; }
    .preview-container { padding: 20px; }
    .preview { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-height: 400px; }
    .loading { text-align: center; padding: 60px 20px; color: #999; }
    .error { background: #fee; border: 1px solid #fcc; color: #c33; padding: 15px; border-radius: 8px; margin: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Lumora Live Preview <span class="status" id="status">● Connected</span></h1>
    <p>Mode: ${this.config.mode.toUpperCase()} • Port: ${this.config.port} • Real-time React Preview</p>
  </div>
  <div class="preview-container">
    <div class="preview" id="root">
      <div class="loading">Loading preview...</div>
    </div>
  </div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    
    function PreviewApp() {
      const [Component, setComponent] = useState(null);
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true);
      
      const loadComponent = async () => {
        try {
          const res = await fetch('/api/react-code');
          const data = await res.json();
          
          if (data.error) {
            setError(data.error);
            setLoading(false);
            return;
          }
          
          if (!data.code || data.code.includes('Waiting for code')) {
            setLoading(true);
            return;
          }
          
          // Try to evaluate and render the component
          try {
            // Create a function that returns the component
            const componentCode = data.code;
            
            // Extract the component (look for export default or export function)
            let ComponentToRender;
            
            if (componentCode.includes('export default')) {
              // Execute the code and get the default export
              const module = { exports: {} };
              const func = new Function('React', 'useState', 'useEffect', 'module', 'exports', componentCode + '; return module.exports.default || exports.default;');
              ComponentToRender = func(React, useState, useEffect, module, module.exports);
            } else if (componentCode.includes('export function') || componentCode.includes('export const')) {
              // Try to extract the function
              const match = componentCode.match(/export (?:function|const) (\\w+)/);
              if (match) {
                const funcName = match[1];
                const func = new Function('React', 'useState', 'useEffect', componentCode + \`; return \${funcName};\`);
                ComponentToRender = func(React, useState, useEffect);
              }
            }
            
            if (ComponentToRender) {
              setComponent(() => ComponentToRender);
              setError(null);
            } else {
              // Fallback: just show the code
              setComponent(() => () => React.createElement('pre', { style: { padding: 20, overflow: 'auto' } }, componentCode));
            }
            setLoading(false);
          } catch (err) {
            console.error('Component render error:', err);
            // Show code as fallback
            setComponent(() => () => React.createElement('pre', { style: { padding: 20, overflow: 'auto', fontSize: 13 } }, data.code));
            setError(null);
            setLoading(false);
          }
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
      
      useEffect(() => {
        loadComponent();
        const interval = setInterval(loadComponent, 2000);
        return () => clearInterval(interval);
      }, []);
      
      if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading preview...');
      }
      
      if (error) {
        return React.createElement('div', { className: 'error' }, 
          React.createElement('strong', null, 'Error: '),
          error
        );
      }
      
      if (!Component) {
        return React.createElement('div', { className: 'loading' }, 
          React.createElement('p', null, 'Waiting for code...'),
          React.createElement('p', { style: { fontSize: 14, marginTop: 10, color: '#999' } }, 
            'Edit your ${this.config.mode === 'react' ? 'React' : 'Flutter'} files to see changes here'
          )
        );
      }
      
      try {
        return React.createElement(Component);
      } catch (err) {
        return React.createElement('div', { className: 'error' }, 
          React.createElement('strong', null, 'Render Error: '),
          err.message
        );
      }
    }
    
    ReactDOM.render(React.createElement(PreviewApp), document.getElementById('root'));
  </script>
</body>
</html>
    `;
    }
    updateIR(ir) {
        this.currentIR = ir;
    }
    start() {
        return new Promise((resolve) => {
            this.app.listen(this.config.port, () => {
                console.log(chalk_1.default.green(`✓ Web preview at http://localhost:${this.config.port}`));
                resolve();
            });
        });
    }
}
exports.WebPreviewServer = WebPreviewServer;
//# sourceMappingURL=web-preview-server.js.map