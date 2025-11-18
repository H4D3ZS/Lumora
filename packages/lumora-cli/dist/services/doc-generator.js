"use strict";
/**
 * Documentation Generator
 * Generates API documentation from TypeScript and Dart source files
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
exports.DocGenerator = void 0;
exports.createDocGenerator = createDocGenerator;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const doc_site_builder_1 = require("./doc-site-builder");
/**
 * Documentation Generator
 */
class DocGenerator {
    constructor(config) {
        this.config = {
            includePrivate: false,
            format: 'markdown',
            ...config,
        };
    }
    /**
     * Generate documentation for entire project
     */
    async generateDocs() {
        await fs.ensureDir(this.config.outputDir);
        // Find all TypeScript files
        const tsFiles = await this.findSourceFiles(this.config.projectPath, '.ts');
        // Parse and extract documentation
        const docs = [];
        for (const file of tsFiles) {
            const fileDocs = await this.extractDocsFromFile(file);
            docs.push(...fileDocs);
        }
        // Generate output based on format
        switch (this.config.format) {
            case 'markdown':
                await this.generateMarkdownDocs(docs);
                break;
            case 'html':
                await this.generateHTMLDocs(docs);
                break;
            case 'json':
                await this.generateJSONDocs(docs);
                break;
        }
        // Generate index
        await this.generateIndex(docs);
    }
    /**
     * Find source files
     */
    async findSourceFiles(dir, ext) {
        const files = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                const subFiles = await this.findSourceFiles(fullPath, ext);
                files.push(...subFiles);
            }
            else if (entry.isFile() && entry.name.endsWith(ext)) {
                files.push(fullPath);
            }
        }
        return files;
    }
    /**
     * Extract documentation from TypeScript file
     */
    async extractDocsFromFile(filePath) {
        const docs = [];
        const sourceText = await fs.readFile(filePath, 'utf-8');
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
        const visit = (node) => {
            // Extract classes
            if (ts.isClassDeclaration(node) && node.name) {
                const doc = this.extractClassDoc(node, sourceFile);
                if (doc && (this.config.includePrivate || !this.isPrivate(node))) {
                    docs.push(doc);
                }
            }
            // Extract interfaces
            if (ts.isInterfaceDeclaration(node)) {
                const doc = this.extractInterfaceDoc(node, sourceFile);
                if (doc && (this.config.includePrivate || !this.isPrivate(node))) {
                    docs.push(doc);
                }
            }
            // Extract functions
            if (ts.isFunctionDeclaration(node) && node.name) {
                const doc = this.extractFunctionDoc(node, sourceFile);
                if (doc && (this.config.includePrivate || !this.isPrivate(node))) {
                    docs.push(doc);
                }
            }
            // Extract type aliases
            if (ts.isTypeAliasDeclaration(node)) {
                const doc = this.extractTypeDoc(node, sourceFile);
                if (doc && (this.config.includePrivate || !this.isPrivate(node))) {
                    docs.push(doc);
                }
            }
            // Extract enums
            if (ts.isEnumDeclaration(node)) {
                const doc = this.extractEnumDoc(node, sourceFile);
                if (doc && (this.config.includePrivate || !this.isPrivate(node))) {
                    docs.push(doc);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return docs;
    }
    /**
     * Extract class documentation
     */
    extractClassDoc(node, sourceFile) {
        if (!node.name)
            return null;
        const jsDoc = this.getJSDoc(node, sourceFile);
        return {
            name: node.name.text,
            type: 'class',
            description: jsDoc.description,
            properties: this.extractProperties(node),
            methods: this.extractMethods(node, sourceFile),
            examples: jsDoc.examples,
            tags: jsDoc.tags,
        };
    }
    /**
     * Extract interface documentation
     */
    extractInterfaceDoc(node, sourceFile) {
        const jsDoc = this.getJSDoc(node, sourceFile);
        return {
            name: node.name.text,
            type: 'interface',
            description: jsDoc.description,
            properties: node.members
                .filter(m => ts.isPropertySignature(m))
                .map(m => this.extractPropertyDoc(m)),
            examples: jsDoc.examples,
            tags: jsDoc.tags,
        };
    }
    /**
     * Extract function documentation
     */
    extractFunctionDoc(node, sourceFile) {
        if (!node.name)
            return null;
        const jsDoc = this.getJSDoc(node, sourceFile);
        return {
            name: node.name.text,
            type: 'function',
            description: jsDoc.description,
            signature: node.getText(sourceFile),
            parameters: node.parameters.map(p => this.extractParameterDoc(p)),
            returnType: node.type ? node.type.getText(sourceFile) : 'void',
            examples: jsDoc.examples,
            tags: jsDoc.tags,
        };
    }
    /**
     * Extract type alias documentation
     */
    extractTypeDoc(node, sourceFile) {
        const jsDoc = this.getJSDoc(node, sourceFile);
        return {
            name: node.name.text,
            type: 'type',
            description: jsDoc.description,
            signature: node.type.getText(sourceFile),
            examples: jsDoc.examples,
            tags: jsDoc.tags,
        };
    }
    /**
     * Extract enum documentation
     */
    extractEnumDoc(node, sourceFile) {
        const jsDoc = this.getJSDoc(node, sourceFile);
        return {
            name: node.name.text,
            type: 'enum',
            description: jsDoc.description,
            properties: node.members.map(m => ({
                name: m.name.getText(sourceFile),
                type: 'enum member',
                description: this.getJSDoc(m, sourceFile).description,
            })),
            examples: jsDoc.examples,
            tags: jsDoc.tags,
        };
    }
    /**
     * Extract properties from class
     */
    extractProperties(node) {
        return node.members
            .filter(m => ts.isPropertyDeclaration(m))
            .map(m => this.extractPropertyDoc(m));
    }
    /**
     * Extract methods from class
     */
    extractMethods(node, sourceFile) {
        return node.members
            .filter(m => ts.isMethodDeclaration(m))
            .map(m => {
            const method = m;
            const jsDoc = this.getJSDoc(method, sourceFile);
            return {
                name: method.name.getText(sourceFile),
                description: jsDoc.description,
                signature: method.getText(sourceFile),
                parameters: method.parameters.map(p => this.extractParameterDoc(p)),
                returnType: method.type ? method.type.getText(sourceFile) : 'void',
                examples: jsDoc.examples,
            };
        });
    }
    /**
     * Extract property documentation
     */
    extractPropertyDoc(node) {
        return {
            name: node.name.getText(),
            type: node.type ? node.type.getText() : 'any',
            readonly: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword),
            optional: !!node.questionToken,
        };
    }
    /**
     * Extract parameter documentation
     */
    extractParameterDoc(node) {
        return {
            name: node.name.getText(),
            type: node.type ? node.type.getText() : 'any',
            optional: !!node.questionToken,
            defaultValue: node.initializer ? node.initializer.getText() : undefined,
        };
    }
    /**
     * Get JSDoc comments
     */
    getJSDoc(node, sourceFile) {
        const result = {
            examples: [],
            tags: {},
        };
        const jsDocTags = ts.getJSDocTags(node);
        // Get description from JSDoc comment
        const jsDocComments = node.jsDoc;
        if (jsDocComments && jsDocComments.length > 0) {
            const comment = jsDocComments[0];
            if (comment.comment) {
                result.description = typeof comment.comment === 'string'
                    ? comment.comment
                    : comment.comment.map((c) => c.text).join('');
            }
        }
        // Extract @example tags
        for (const tag of jsDocTags) {
            if (tag.tagName.text === 'example' && tag.comment) {
                const example = typeof tag.comment === 'string'
                    ? tag.comment
                    : tag.comment.map((c) => c.text).join('');
                result.examples.push(example);
            }
            else if (tag.comment) {
                const value = typeof tag.comment === 'string'
                    ? tag.comment
                    : tag.comment.map((c) => c.text).join('');
                result.tags[tag.tagName.text] = value;
            }
        }
        return result;
    }
    /**
     * Check if node is private
     */
    isPrivate(node) {
        // Check if node can have modifiers
        if (ts.canHaveModifiers(node)) {
            const modifiers = ts.getModifiers(node);
            return modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword) || false;
        }
        return false;
    }
    /**
     * Generate Markdown documentation
     */
    async generateMarkdownDocs(docs) {
        // Group by type
        const grouped = this.groupByType(docs);
        for (const [type, items] of Object.entries(grouped)) {
            const markdown = this.generateMarkdownForType(type, items);
            const filename = `${type}s.md`;
            await fs.writeFile(path.join(this.config.outputDir, filename), markdown);
        }
    }
    /**
     * Generate Markdown for specific type
     */
    generateMarkdownForType(type, docs) {
        let markdown = `# ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
        for (const doc of docs) {
            markdown += `## ${doc.name}\n\n`;
            if (doc.description) {
                markdown += `${doc.description}\n\n`;
            }
            if (doc.signature) {
                markdown += `\`\`\`typescript\n${doc.signature}\n\`\`\`\n\n`;
            }
            if (doc.parameters && doc.parameters.length > 0) {
                markdown += `### Parameters\n\n`;
                for (const param of doc.parameters) {
                    markdown += `- **${param.name}** (\`${param.type}\`)${param.optional ? ' (optional)' : ''}`;
                    if (param.description) {
                        markdown += `: ${param.description}`;
                    }
                    if (param.defaultValue) {
                        markdown += ` (default: \`${param.defaultValue}\`)`;
                    }
                    markdown += '\n';
                }
                markdown += '\n';
            }
            if (doc.returnType) {
                markdown += `### Returns\n\n\`${doc.returnType}\`\n\n`;
            }
            if (doc.properties && doc.properties.length > 0) {
                markdown += `### Properties\n\n`;
                for (const prop of doc.properties) {
                    markdown += `- **${prop.name}** (\`${prop.type}\`)`;
                    if (prop.readonly)
                        markdown += ' (readonly)';
                    if (prop.optional)
                        markdown += ' (optional)';
                    if (prop.description)
                        markdown += `: ${prop.description}`;
                    markdown += '\n';
                }
                markdown += '\n';
            }
            if (doc.methods && doc.methods.length > 0) {
                markdown += `### Methods\n\n`;
                for (const method of doc.methods) {
                    markdown += `#### ${method.name}\n\n`;
                    if (method.description) {
                        markdown += `${method.description}\n\n`;
                    }
                    markdown += `\`\`\`typescript\n${method.signature}\n\`\`\`\n\n`;
                }
            }
            if (doc.examples && doc.examples.length > 0) {
                markdown += `### Examples\n\n`;
                for (const example of doc.examples) {
                    markdown += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
                }
            }
            markdown += '---\n\n';
        }
        return markdown;
    }
    /**
     * Generate HTML documentation
     */
    async generateHTMLDocs(docs) {
        // Use DocSiteBuilder for comprehensive site generation
        const siteConfig = {
            outputDir: this.config.outputDir,
            title: this.config.title || 'Lumora Documentation',
            description: 'Build React apps that run on Flutter',
            theme: 'auto',
            primaryColor: '#007bff',
        };
        const builder = new doc_site_builder_1.DocSiteBuilder(siteConfig);
        await builder.buildSite(docs);
    }
    /**
     * Generate HTML page
     */
    generateHTMLPage(docs) {
        const grouped = this.groupByType(docs);
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.title || 'API Documentation'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #0066cc; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    .type-badge { display: inline-block; padding: 2px 8px; background: #e0e0e0; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.config.title || 'API Documentation'}</h1>
`;
        for (const [type, items] of Object.entries(grouped)) {
            html += `<h2>${type.charAt(0).toUpperCase() + type.slice(1)}s</h2>`;
            for (const doc of items) {
                html += `<div class="api-item">`;
                html += `<h3><span class="type-badge">${doc.type}</span> ${doc.name}</h3>`;
                if (doc.description) {
                    html += `<p>${doc.description}</p>`;
                }
                if (doc.signature) {
                    html += `<pre><code>${this.escapeHTML(doc.signature)}</code></pre>`;
                }
                html += `</div>`;
            }
        }
        html += `
  </div>
</body>
</html>`;
        return html;
    }
    /**
     * Generate JSON documentation
     */
    async generateJSONDocs(docs) {
        const json = JSON.stringify(docs, null, 2);
        await fs.writeFile(path.join(this.config.outputDir, 'api.json'), json);
    }
    /**
     * Generate index file
     */
    async generateIndex(docs) {
        const grouped = this.groupByType(docs);
        let index = `# API Reference\n\n`;
        index += `Generated: ${new Date().toLocaleString()}\n\n`;
        index += `Total: ${docs.length} items\n\n`;
        for (const [type, items] of Object.entries(grouped)) {
            index += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})\n\n`;
            for (const item of items) {
                index += `- [${item.name}](./${type}s.md#${item.name.toLowerCase()})\n`;
            }
            index += '\n';
        }
        await fs.writeFile(path.join(this.config.outputDir, 'README.md'), index);
    }
    /**
     * Group docs by type
     */
    groupByType(docs) {
        const grouped = {};
        for (const doc of docs) {
            if (!grouped[doc.type]) {
                grouped[doc.type] = [];
            }
            grouped[doc.type].push(doc);
        }
        return grouped;
    }
    /**
     * Escape HTML
     */
    escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
exports.DocGenerator = DocGenerator;
// Export singleton
function createDocGenerator(config) {
    return new DocGenerator(config);
}
//# sourceMappingURL=doc-generator.js.map