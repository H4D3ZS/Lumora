"use strict";
/**
 * Documentation Site Builder
 * Generates a static documentation website
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocSiteBuilder = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Documentation Site Builder
 */
class DocSiteBuilder {
    constructor(config) {
        this.config = {
            title: 'Lumora Documentation',
            description: 'Build React apps that run on Flutter',
            logo: '',
            theme: 'auto',
            primaryColor: '#007bff',
            githubUrl: '',
            ...config,
        };
    }
    /**
     * Build the documentation site
     */
    async buildSite(docs) {
        await fs.ensureDir(this.config.outputDir);
        // Create directory structure
        await this.createDirectoryStructure();
        // Generate pages
        await this.generateHomePage();
        await this.generateDocsPages(docs);
        await this.generateSearchIndex(docs);
        // Copy assets
        await this.generateStyles();
        await this.generateScripts();
    }
    /**
     * Create directory structure
     */
    async createDirectoryStructure() {
        const dirs = [
            'css',
            'js',
            'api',
            'guides',
            'tutorials',
        ];
        for (const dir of dirs) {
            await fs.ensureDir(path.join(this.config.outputDir, dir));
        }
    }
    /**
     * Generate home page
     */
    async generateHomePage() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.title}</title>
  <meta name="description" content="${this.config.description}">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-brand">
        ${this.config.logo ? `<img src="${this.config.logo}" alt="Logo" class="logo">` : ''}
        <h1>${this.config.title}</h1>
      </div>
      <div class="navbar-menu">
        <a href="#getting-started">Getting Started</a>
        <a href="api/index.html">API Reference</a>
        <a href="#guides">Guides</a>
        <a href="#tutorials">Tutorials</a>
        ${this.config.githubUrl ? `<a href="${this.config.githubUrl}" target="_blank">GitHub</a>` : ''}
      </div>
      <div class="search-box">
        <input type="search" id="search" placeholder="Search docs...">
        <div id="search-results" class="search-results"></div>
      </div>
    </div>
  </nav>

  <main class="container">
    <section class="hero">
      <h1>Welcome to ${this.config.title}</h1>
      <p class="lead">${this.config.description}</p>
      <div class="hero-buttons">
        <a href="#getting-started" class="btn btn-primary">Get Started</a>
        <a href="api/index.html" class="btn btn-outline">API Reference</a>
      </div>
    </section>

    <section id="getting-started" class="section">
      <h2>Getting Started</h2>
      <div class="card-grid">
        <div class="card">
          <h3>🚀 Quick Start</h3>
          <p>Create your first Lumora app in minutes</p>
          <pre><code class="language-bash">npm install -g lumora-cli
lumora init my-app
cd my-app
lumora start</code></pre>
        </div>

        <div class="card">
          <h3>📦 Templates</h3>
          <p>Start with pre-built templates</p>
          <pre><code class="language-bash">lumora template list
lumora template create tabs my-app</code></pre>
        </div>

        <div class="card">
          <h3>📚 Tutorials</h3>
          <p>Interactive step-by-step tutorials</p>
          <pre><code class="language-bash">lumora tutorial list
lumora tutorial start getting-started</code></pre>
        </div>
      </div>
    </section>

    <section id="features" class="section">
      <h2>Key Features</h2>
      <div class="feature-grid">
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <h3>Write React, Run Flutter</h3>
          <p>Write your UI in React and TypeScript, automatically converted to native Flutter code</p>
        </div>

        <div class="feature">
          <div class="feature-icon">🔄</div>
          <h3>Hot Reload</h3>
          <p>Instant updates without losing state. Changes appear in milliseconds</p>
        </div>

        <div class="feature">
          <div class="feature-icon">📱</div>
          <h3>Native Modules</h3>
          <p>Access camera, location, notifications, and more with simple APIs</p>
        </div>

        <div class="feature">
          <div class="feature-icon">☁️</div>
          <h3>OTA Updates</h3>
          <p>Push updates instantly without app store review</p>
        </div>

        <div class="feature">
          <div class="feature-icon">🎨</div>
          <h3>Rich Templates</h3>
          <p>12+ starter templates from basic to advanced apps</p>
        </div>

        <div class="feature">
          <div class="feature-icon">🛠️</div>
          <h3>Developer Tools</h3>
          <p>Component inspector, performance monitor, network debugger</p>
        </div>
      </div>
    </section>

    <section id="guides" class="section">
      <h2>Guides</h2>
      <div class="guide-list">
        <a href="guides/installation.html" class="guide-item">
          <h3>Installation</h3>
          <p>Set up your development environment</p>
        </a>
        <a href="guides/first-app.html" class="guide-item">
          <h3>Your First App</h3>
          <p>Build a simple counter app</p>
        </a>
        <a href="guides/state-management.html" class="guide-item">
          <h3>State Management</h3>
          <p>Manage complex state with hooks and Redux</p>
        </a>
        <a href="guides/native-modules.html" class="guide-item">
          <h3>Native Modules</h3>
          <p>Use camera, location, and other native features</p>
        </a>
        <a href="guides/ota-updates.html" class="guide-item">
          <h3>OTA Updates</h3>
          <p>Deploy updates without app store review</p>
        </a>
        <a href="guides/building.html" class="guide-item">
          <h3>Building for Production</h3>
          <p>Create production builds for iOS and Android</p>
        </a>
      </div>
    </section>

    <section id="tutorials" class="section">
      <h2>Interactive Tutorials</h2>
      <p>Learn by doing with our interactive command-line tutorials:</p>
      <pre><code class="language-bash">lumora tutorial list</code></pre>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 Lumora Framework. All rights reserved.</p>
      <div class="footer-links">
        <a href="api/index.html">API</a>
        <a href="#guides">Guides</a>
        ${this.config.githubUrl ? `<a href="${this.config.githubUrl}">GitHub</a>` : ''}
      </div>
    </div>
  </footer>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="js/search.js"></script>
  <script src="js/main.js"></script>
</body>
</html>`;
        await fs.writeFile(path.join(this.config.outputDir, 'index.html'), html);
    }
    /**
     * Generate API documentation pages
     */
    async generateDocsPages(docs) {
        // Group docs by type
        const grouped = this.groupByType(docs);
        // Generate index page
        await this.generateAPIIndex(grouped);
        // Generate individual doc pages
        for (const [type, items] of Object.entries(grouped)) {
            for (const item of items) {
                await this.generateDocPage(item, type);
            }
        }
    }
    /**
     * Generate API index page
     */
    async generateAPIIndex(grouped) {
        let content = '';
        for (const [type, items] of Object.entries(grouped)) {
            content += `
      <section class="api-section">
        <h2>${this.capitalize(type)}s</h2>
        <div class="api-list">`;
            items.forEach(item => {
                content += `
          <a href="${type}/${item.name}.html" class="api-item">
            <h3>${item.name}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
          </a>`;
            });
            content += `
        </div>
      </section>`;
        }
        const html = this.wrapInTemplate('API Reference', content);
        await fs.writeFile(path.join(this.config.outputDir, 'api', 'index.html'), html);
    }
    /**
     * Generate individual documentation page
     */
    async generateDocPage(doc, type) {
        let content = `
    <div class="doc-header">
      <div class="breadcrumb">
        <a href="../index.html">Docs</a> /
        <a href="index.html">API</a> /
        <span>${this.capitalize(type)}s</span>
      </div>
      <h1>${doc.name}</h1>
      ${doc.description ? `<p class="lead">${doc.description}</p>` : ''}
    </div>`;
        // Signature
        if (doc.signature) {
            content += `
      <section class="section">
        <h2>Signature</h2>
        <pre><code class="language-typescript">${this.escapeHtml(doc.signature)}</code></pre>
      </section>`;
        }
        // Parameters
        if (doc.parameters && doc.parameters.length > 0) {
            content += `
      <section class="section">
        <h2>Parameters</h2>
        <table class="params-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>`;
            doc.parameters.forEach(param => {
                content += `
            <tr>
              <td><code>${param.name}${param.optional ? '?' : ''}</code></td>
              <td><code>${param.type}</code></td>
              <td>${param.description || ''}</td>
            </tr>`;
            });
            content += `
          </tbody>
        </table>
      </section>`;
        }
        // Properties
        if (doc.properties && doc.properties.length > 0) {
            content += `
      <section class="section">
        <h2>Properties</h2>
        <table class="params-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>`;
            doc.properties.forEach(prop => {
                content += `
            <tr>
              <td><code>${prop.name}${prop.optional ? '?' : ''}</code></td>
              <td><code>${prop.type}</code></td>
              <td>${prop.description || ''}</td>
            </tr>`;
            });
            content += `
          </tbody>
        </table>
      </section>`;
        }
        // Methods
        if (doc.methods && doc.methods.length > 0) {
            content += `
      <section class="section">
        <h2>Methods</h2>`;
            doc.methods.forEach(method => {
                content += `
        <div class="method">
          <h3>${method.name}</h3>
          ${method.description ? `<p>${method.description}</p>` : ''}
          <pre><code class="language-typescript">${this.escapeHtml(method.signature)}</code></pre>
        </div>`;
            });
            content += `
      </section>`;
        }
        // Examples
        if (doc.examples && doc.examples.length > 0) {
            content += `
      <section class="section">
        <h2>Examples</h2>`;
            doc.examples.forEach((example, index) => {
                content += `
        <div class="example">
          <h3>Example ${index + 1}</h3>
          <pre><code class="language-typescript">${this.escapeHtml(example)}</code></pre>
        </div>`;
            });
            content += `
      </section>`;
        }
        const html = this.wrapInTemplate(doc.name, content, '../');
        const typeDir = path.join(this.config.outputDir, 'api', type);
        await fs.ensureDir(typeDir);
        await fs.writeFile(path.join(typeDir, `${doc.name}.html`), html);
    }
    /**
     * Generate search index
     */
    async generateSearchIndex(docs) {
        const searchIndex = docs.map(doc => ({
            name: doc.name,
            type: doc.type,
            description: doc.description || '',
            url: `api/${doc.type}/${doc.name}.html`,
        }));
        const js = `window.searchIndex = ${JSON.stringify(searchIndex, null, 2)};`;
        await fs.writeFile(path.join(this.config.outputDir, 'js', 'search-index.js'), js);
    }
    /**
     * Generate styles
     */
    async generateStyles() {
        const css = `
:root {
  --primary-color: ${this.config.primaryColor};
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #e0e0e0;
  --code-bg: #f5f5f5;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background: var(--bg-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Navbar */
.navbar {
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow);
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-brand h1 {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.logo {
  height: 40px;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
}

.navbar-menu a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.navbar-menu a:hover {
  color: var(--primary-color);
}

/* Search */
.search-box {
  position: relative;
}

.search-box input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  width: 300px;
  font-size: 0.9rem;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  display: none;
  box-shadow: var(--shadow);
}

.search-results.active {
  display: block;
}

.search-result-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  text-decoration: none;
  display: block;
  color: var(--text-color);
}

.search-result-item:hover {
  background: #f8f9fa;
}

.search-result-item:last-child {
  border-bottom: none;
}

/* Hero */
.hero {
  text-align: center;
  padding: 4rem 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.lead {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: 2px solid var(--primary-color);
}

.btn-primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

/* Sections */
.section {
  padding: 3rem 0;
  border-bottom: 1px solid var(--border-color);
}

.section h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

/* Cards */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.card h3 {
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

/* Features */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature {
  text-align: center;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature h3 {
  margin-bottom: 0.5rem;
}

/* Code */
pre {
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
}

/* Tables */
.params-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.params-table th {
  background: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
}

.params-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

/* Guide list */
.guide-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.guide-item {
  display: block;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.3s;
}

.guide-item:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.guide-item h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

/* Footer */
.footer {
  background: #f8f9fa;
  padding: 2rem 0;
  margin-top: 4rem;
  border-top: 1px solid var(--border-color);
}

.footer .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-links a {
  color: var(--text-color);
  text-decoration: none;
}

.footer-links a:hover {
  color: var(--primary-color);
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 1rem;
  color: #666;
}

.breadcrumb a {
  color: var(--primary-color);
  text-decoration: none;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar .container {
    flex-direction: column;
    gap: 1rem;
  }

  .navbar-menu {
    flex-wrap: wrap;
    justify-content: center;
  }

  .search-box input {
    width: 100%;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
  }
}`;
        await fs.writeFile(path.join(this.config.outputDir, 'css', 'styles.css'), css);
    }
    /**
     * Generate JavaScript
     */
    async generateScripts() {
        // Main script
        const mainJs = `
// Syntax highlighting
document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});`;
        await fs.writeFile(path.join(this.config.outputDir, 'js', 'main.js'), mainJs);
        // Search script
        const searchJs = `
let searchIndex = [];

// Load search index
fetch('js/search-index.js')
  .then(response => response.text())
  .then(script => {
    eval(script);
    searchIndex = window.searchIndex || [];
  });

// Search functionality
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query.length < 2) {
      searchResults.classList.remove('active');
      return;
    }

    const results = searchIndex.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    ).slice(0, 10);

    if (results.length > 0) {
      searchResults.innerHTML = results.map(item => \`
        <a href="\${item.url}" class="search-result-item">
          <strong>\${item.name}</strong>
          <span style="color: #666; font-size: 0.9rem;"> - \${item.type}</span>
          <div style="font-size: 0.9rem; color: #666;">\${item.description}</div>
        </a>
      \`).join('');
      searchResults.classList.add('active');
    } else {
      searchResults.innerHTML = '<div style="padding: 1rem; color: #666;">No results found</div>';
      searchResults.classList.add('active');
    }
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });
}`;
        await fs.writeFile(path.join(this.config.outputDir, 'js', 'search.js'), searchJs);
    }
    /**
     * Wrap content in template
     */
    wrapInTemplate(title, content, baseUrl = '') {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${this.config.title}</title>
  <link rel="stylesheet" href="${baseUrl}css/styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-brand">
        <a href="${baseUrl}index.html"><h1>${this.config.title}</h1></a>
      </div>
      <div class="navbar-menu">
        <a href="${baseUrl}index.html">Home</a>
        <a href="${baseUrl}api/index.html">API Reference</a>
        ${this.config.githubUrl ? `<a href="${this.config.githubUrl}" target="_blank">GitHub</a>` : ''}
      </div>
    </div>
  </nav>

  <main class="container" style="padding: 2rem 0;">
    ${content}
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 ${this.config.title}. All rights reserved.</p>
    </div>
  </footer>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="${baseUrl}js/main.js"></script>
</body>
</html>`;
    }
    /**
     * Group docs by type
     */
    groupByType(docs) {
        const grouped = {};
        docs.forEach(doc => {
            if (!grouped[doc.type]) {
                grouped[doc.type] = [];
            }
            grouped[doc.type].push(doc);
        });
        return grouped;
    }
    /**
     * Capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
exports.DocSiteBuilder = DocSiteBuilder;
//# sourceMappingURL=doc-site-builder.js.map