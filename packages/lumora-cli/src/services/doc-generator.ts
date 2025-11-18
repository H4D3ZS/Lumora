/**
 * Documentation Generator
 * Generates API documentation from TypeScript and Dart source files
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';
import { DocSiteBuilder, DocSiteConfig } from './doc-site-builder';

export interface DocConfig {
  projectPath: string;
  outputDir: string;
  title?: string;
  includePrivate?: boolean;
  format?: 'markdown' | 'html' | 'json';
}

export interface APIDoc {
  name: string;
  type: 'class' | 'function' | 'interface' | 'type' | 'enum';
  description?: string;
  signature?: string;
  parameters?: ParameterDoc[];
  returnType?: string;
  properties?: PropertyDoc[];
  methods?: MethodDoc[];
  examples?: string[];
  tags?: Record<string, string>;
}

export interface ParameterDoc {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface PropertyDoc {
  name: string;
  type: string;
  description?: string;
  readonly?: boolean;
  optional?: boolean;
}

export interface MethodDoc {
  name: string;
  description?: string;
  signature: string;
  parameters?: ParameterDoc[];
  returnType?: string;
  examples?: string[];
}

/**
 * Documentation Generator
 */
export class DocGenerator {
  private config: DocConfig;

  constructor(config: DocConfig) {
    this.config = {
      includePrivate: false,
      format: 'markdown',
      ...config,
    };
  }

  /**
   * Generate documentation for entire project
   */
  async generateDocs(): Promise<void> {
    await fs.ensureDir(this.config.outputDir);

    // Find all TypeScript files
    const tsFiles = await this.findSourceFiles(this.config.projectPath, '.ts');

    // Parse and extract documentation
    const docs: APIDoc[] = [];
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
  private async findSourceFiles(dir: string, ext: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await this.findSourceFiles(fullPath, ext);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract documentation from TypeScript file
   */
  private async extractDocsFromFile(filePath: string): Promise<APIDoc[]> {
    const docs: APIDoc[] = [];

    const sourceText = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
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
  private extractClassDoc(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): APIDoc | null {
    if (!node.name) return null;

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
  private extractInterfaceDoc(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): APIDoc {
    const jsDoc = this.getJSDoc(node, sourceFile);

    return {
      name: node.name.text,
      type: 'interface',
      description: jsDoc.description,
      properties: node.members
        .filter(m => ts.isPropertySignature(m))
        .map(m => this.extractPropertyDoc(m as ts.PropertySignature)),
      examples: jsDoc.examples,
      tags: jsDoc.tags,
    };
  }

  /**
   * Extract function documentation
   */
  private extractFunctionDoc(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): APIDoc | null {
    if (!node.name) return null;

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
  private extractTypeDoc(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): APIDoc {
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
  private extractEnumDoc(node: ts.EnumDeclaration, sourceFile: ts.SourceFile): APIDoc {
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
  private extractProperties(node: ts.ClassDeclaration): PropertyDoc[] {
    return node.members
      .filter(m => ts.isPropertyDeclaration(m))
      .map(m => this.extractPropertyDoc(m as ts.PropertyDeclaration));
  }

  /**
   * Extract methods from class
   */
  private extractMethods(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): MethodDoc[] {
    return node.members
      .filter(m => ts.isMethodDeclaration(m))
      .map(m => {
        const method = m as ts.MethodDeclaration;
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
  private extractPropertyDoc(node: ts.PropertyDeclaration | ts.PropertySignature): PropertyDoc {
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
  private extractParameterDoc(node: ts.ParameterDeclaration): ParameterDoc {
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
  private getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): {
    description?: string;
    examples: string[];
    tags: Record<string, string>;
  } {
    const result: { description?: string; examples: string[]; tags: Record<string, string> } = {
      examples: [],
      tags: {},
    };

    const jsDocTags = ts.getJSDocTags(node);

    // Get description from JSDoc comment
    const jsDocComments = (node as any).jsDoc;
    if (jsDocComments && jsDocComments.length > 0) {
      const comment = jsDocComments[0];
      if (comment.comment) {
        result.description = typeof comment.comment === 'string'
          ? comment.comment
          : comment.comment.map((c: any) => c.text).join('');
      }
    }

    // Extract @example tags
    for (const tag of jsDocTags) {
      if (tag.tagName.text === 'example' && tag.comment) {
        const example = typeof tag.comment === 'string'
          ? tag.comment
          : tag.comment.map((c: any) => c.text).join('');
        result.examples.push(example);
      } else if (tag.comment) {
        const value = typeof tag.comment === 'string'
          ? tag.comment
          : tag.comment.map((c: any) => c.text).join('');
        result.tags[tag.tagName.text] = value;
      }
    }

    return result;
  }

  /**
   * Check if node is private
   */
  private isPrivate(node: ts.Node): boolean {
    // Check if node can have modifiers
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      return modifiers?.some((m: ts.Modifier) => m.kind === ts.SyntaxKind.PrivateKeyword) || false;
    }
    return false;
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdownDocs(docs: APIDoc[]): Promise<void> {
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
  private generateMarkdownForType(type: string, docs: APIDoc[]): string {
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
          if (prop.readonly) markdown += ' (readonly)';
          if (prop.optional) markdown += ' (optional)';
          if (prop.description) markdown += `: ${prop.description}`;
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
  private async generateHTMLDocs(docs: APIDoc[]): Promise<void> {
    // Use DocSiteBuilder for comprehensive site generation
    const siteConfig: DocSiteConfig = {
      outputDir: this.config.outputDir,
      title: this.config.title || 'Lumora Documentation',
      description: 'Build React apps that run on Flutter',
      theme: 'auto',
      primaryColor: '#007bff',
    };

    const builder = new DocSiteBuilder(siteConfig);
    await builder.buildSite(docs);
  }

  /**
   * Generate HTML page
   */
  private generateHTMLPage(docs: APIDoc[]): string {
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
  private async generateJSONDocs(docs: APIDoc[]): Promise<void> {
    const json = JSON.stringify(docs, null, 2);
    await fs.writeFile(path.join(this.config.outputDir, 'api.json'), json);
  }

  /**
   * Generate index file
   */
  private async generateIndex(docs: APIDoc[]): Promise<void> {
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
  private groupByType(docs: APIDoc[]): Record<string, APIDoc[]> {
    const grouped: Record<string, APIDoc[]> = {};

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
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Export singleton
export function createDocGenerator(config: DocConfig): DocGenerator {
  return new DocGenerator(config);
}
