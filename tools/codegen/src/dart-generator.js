const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const SchemaToDart = require('./schema-to-dart');

/**
 * DartGenerator - Generates Dart code with Clean Architecture structure
 */
class DartGenerator {
  constructor(adapter = 'bloc', options = {}) {
    this.adapter = adapter;
    this.schemaToDart = new SchemaToDart();
    this.templates = {};
    this.options = {
      optimize: options.optimize !== false, // Default to true
      removeDebugCode: options.removeDebugCode !== false,
      useConstConstructors: options.useConstConstructors !== false,
      ...options
    };
    
    // Register Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  registerHelpers() {
    Handlebars.registerHelper('capitalize', function(str) {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('lowercase', function(str) {
      if (typeof str !== 'string') return '';
      return str.toLowerCase();
    });

    Handlebars.registerHelper('snakeCase', function(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    });
  }

  /**
   * Load templates for the selected adapter
   * @param {string} templatesDir - Path to templates directory
   */
  loadTemplates(templatesDir) {
    const adapterDir = path.join(templatesDir, this.adapter);
    
    if (!fs.existsSync(adapterDir)) {
      throw new Error(`Templates not found for adapter: ${this.adapter}`);
    }

    const templateFiles = fs.readdirSync(adapterDir);
    
    for (const file of templateFiles) {
      if (file.endsWith('.hbs')) {
        const templatePath = path.join(adapterDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const templateName = file.replace('.hbs', '');
        this.templates[templateName] = Handlebars.compile(templateContent);
      }
    }
  }

  /**
   * Get Clean Architecture directory structure for adapter
   * @param {string} featureName - Feature name
   * @returns {object} Directory structure
   */
  getDirectoryStructure(featureName) {
    const baseStructure = {
      domain: {
        entities: [],
        usecases: []
      },
      data: {
        models: [],
        repositories: []
      },
      presentation: {
        pages: [],
        widgets: []
      }
    };

    // Adapter-specific structure
    switch (this.adapter) {
      case 'bloc':
        baseStructure.presentation.bloc = [];
        break;
      case 'riverpod':
        baseStructure.presentation.providers = [];
        break;
      case 'provider':
        baseStructure.presentation.notifiers = [];
        break;
      case 'getx':
        baseStructure.presentation.controllers = [];
        baseStructure.presentation.bindings = [];
        break;
    }

    return baseStructure;
  }

  /**
   * Generate files for the feature
   * @param {string} schemaPath - Path to schema JSON file
   * @param {string} outputDir - Output directory
   * @param {string} featureName - Feature name
   * @param {object} options - Generation options
   * @returns {array} Generated file paths
   */
  generateFiles(schemaPath, outputDir, featureName, options = {}) {
    const generatedFiles = [];
    
    // Load schema and convert to Dart widget code
    const mappingPath = path.join(__dirname, '..', 'ui-mapping.json');
    this.schemaToDart.loadMapping(mappingPath);
    const schema = this.schemaToDart.loadSchema(schemaPath);
    let widgetCode = this.schemaToDart.convertToDart(schema);

    // Apply optimizations if enabled
    if (this.options.optimize) {
      widgetCode = this.optimizeWidgetCode(widgetCode);
    }

    // Prepare template data
    const templateData = {
      featureName: this.capitalize(featureName),
      featureTitle: this.toTitle(featureName),
      widgetCode: widgetCode,
      events: options.events || [],
      methods: options.methods || [],
      stateFields: options.stateFields || []
    };

    // Create directory structure
    const structure = this.getDirectoryStructure(featureName);
    this.createDirectoryStructure(outputDir, featureName, structure);

    // Generate files based on adapter
    let files = [];
    switch (this.adapter) {
      case 'bloc':
        files = this.generateBlocFiles(outputDir, featureName, templateData);
        break;
      case 'riverpod':
        files = this.generateRiverpodFiles(outputDir, featureName, templateData);
        break;
      case 'provider':
        files = this.generateProviderFiles(outputDir, featureName, templateData);
        break;
      case 'getx':
        files = this.generateGetXFiles(outputDir, featureName, templateData);
        break;
    }

    // Optimize generated files
    if (this.options.optimize) {
      files.forEach(filePath => {
        this.optimizeGeneratedFile(filePath);
      });
    }

    generatedFiles.push(...files);
    return generatedFiles;
  }

  /**
   * Optimize widget code
   * @param {string} code - Widget code
   * @returns {string} Optimized code
   */
  optimizeWidgetCode(code) {
    let optimized = code;

    // Use const constructors where possible
    if (this.options.useConstConstructors) {
      optimized = this.addConstConstructors(optimized);
    }

    return optimized;
  }

  /**
   * Add const constructors where possible
   * @param {string} code - Dart code
   * @returns {string} Code with const constructors
   */
  addConstConstructors(code) {
    // Add const to widgets that don't have dynamic content
    let optimized = code;

    // Pattern: Container() without variables -> const Container()
    optimized = optimized.replace(/\bContainer\(\s*\)/g, 'const Container()');
    
    // Pattern: SizedBox() -> const SizedBox()
    optimized = optimized.replace(/\bSizedBox\(\s*\)/g, 'const SizedBox()');
    
    // Pattern: SizedBox.shrink() -> const SizedBox.shrink()
    optimized = optimized.replace(/\bSizedBox\.shrink\(\s*\)/g, 'const SizedBox.shrink()');

    // Pattern: EdgeInsets.zero -> const EdgeInsets.zero (already handled in generator)
    
    return optimized;
  }

  /**
   * Optimize a generated file
   * @param {string} filePath - Path to file
   */
  optimizeGeneratedFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove debug code if enabled
    if (this.options.removeDebugCode) {
      content = this.removeDebugCode(content);
    }

    // Remove unused imports
    content = this.removeUnusedImports(content);

    // Format code
    content = this.formatDartCode(content);

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Remove debug code from generated file
   * @param {string} content - File content
   * @returns {string} Content without debug code
   */
  removeDebugCode(content) {
    let cleaned = content;

    // Remove debug print statements
    cleaned = cleaned.replace(/^\s*print\([^)]*\);\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*debugPrint\([^)]*\);\s*$/gm, '');

    // Remove debug comments (but keep doc comments)
    cleaned = cleaned.replace(/^\s*\/\/ DEBUG:.*$/gm, '');
    cleaned = cleaned.replace(/^\s*\/\/ TODO: Remove this debug code.*$/gm, '');

    return cleaned;
  }

  /**
   * Remove unused imports from file
   * @param {string} content - File content
   * @returns {string} Content with unused imports removed
   */
  removeUnusedImports(content) {
    const lines = content.split('\n');
    const imports = [];
    const otherLines = [];

    // Separate imports from other lines
    lines.forEach(line => {
      if (line.trim().startsWith('import ')) {
        imports.push(line);
      } else {
        otherLines.push(line);
      }
    });

    const codeContent = otherLines.join('\n');
    const usedImports = [];

    // Check which imports are actually used
    imports.forEach(importLine => {
      const match = importLine.match(/import\s+['"]([^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        
        // Extract package/library name
        const packageMatch = importPath.match(/package:([^\/]+)/);
        if (packageMatch) {
          const packageName = packageMatch[1];
          
          // Check if package is used in code
          // This is a simple heuristic - could be improved
          if (codeContent.includes(packageName) || 
              importPath.includes('_bloc.dart') ||
              importPath.includes('_event.dart') ||
              importPath.includes('_state.dart') ||
              importPath.includes('_provider.dart') ||
              importPath.includes('_notifier.dart') ||
              importPath.includes('_controller.dart') ||
              importPath.includes('_binding.dart')) {
            usedImports.push(importLine);
          }
        } else {
          // Keep relative imports
          usedImports.push(importLine);
        }
      }
    });

    // Reconstruct file with only used imports
    return [...usedImports, '', ...otherLines].join('\n');
  }

  /**
   * Format Dart code (basic formatting)
   * @param {string} content - File content
   * @returns {string} Formatted content
   */
  formatDartCode(content) {
    let formatted = content;

    // Remove multiple consecutive blank lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Ensure single blank line after imports
    formatted = formatted.replace(/(import\s+[^;]+;)\n+((?!import)[^\n])/g, '$1\n\n$2');

    // Remove trailing whitespace
    formatted = formatted.replace(/[ \t]+$/gm, '');

    // Ensure file ends with newline
    if (!formatted.endsWith('\n')) {
      formatted += '\n';
    }

    return formatted;
  }

  /**
   * Create directory structure
   * @param {string} baseDir - Base directory
   * @param {string} featureName - Feature name
   * @param {object} structure - Directory structure
   */
  createDirectoryStructure(baseDir, featureName, structure) {
    const featureDir = path.join(baseDir, 'lib', 'features', featureName.toLowerCase());
    
    const createDirs = (parentDir, struct) => {
      for (const [key, value] of Object.entries(struct)) {
        const dirPath = path.join(parentDir, key);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        if (typeof value === 'object' && !Array.isArray(value)) {
          createDirs(dirPath, value);
        }
      }
    };

    createDirs(featureDir, structure);
  }

  /**
   * Generate Bloc files
   * @param {string} outputDir - Output directory
   * @param {string} featureName - Feature name
   * @param {object} templateData - Template data
   * @returns {array} Generated file paths
   */
  generateBlocFiles(outputDir, featureName, templateData) {
    const files = [];
    const featureDir = path.join(outputDir, 'lib', 'features', featureName.toLowerCase());
    const lowerFeatureName = featureName.toLowerCase();

    // Update template data with lowercase feature name for imports
    const updatedTemplateData = {
      ...templateData,
      featureNameLower: lowerFeatureName
    };

    // Generate event file
    if (this.templates['feature_event.dart']) {
      const eventPath = path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_event.dart`);
      const eventContent = this.templates['feature_event.dart'](updatedTemplateData);
      fs.writeFileSync(eventPath, eventContent, 'utf-8');
      files.push(eventPath);
    }

    // Generate state file
    if (this.templates['feature_state.dart']) {
      const statePath = path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_state.dart`);
      const stateContent = this.templates['feature_state.dart'](updatedTemplateData);
      fs.writeFileSync(statePath, stateContent, 'utf-8');
      files.push(statePath);
    }

    // Generate bloc file
    if (this.templates['feature_bloc.dart']) {
      const blocPath = path.join(featureDir, 'presentation', 'bloc', `${lowerFeatureName}_bloc.dart`);
      const blocContent = this.templates['feature_bloc.dart'](updatedTemplateData);
      fs.writeFileSync(blocPath, blocContent, 'utf-8');
      files.push(blocPath);
    }

    // Generate page file
    if (this.templates['feature_page.dart']) {
      const pagePath = path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`);
      const pageContent = this.templates['feature_page.dart'](updatedTemplateData);
      fs.writeFileSync(pagePath, pageContent, 'utf-8');
      files.push(pagePath);
    }

    return files;
  }

  /**
   * Generate Riverpod files
   * @param {string} outputDir - Output directory
   * @param {string} featureName - Feature name
   * @param {object} templateData - Template data
   * @returns {array} Generated file paths
   */
  generateRiverpodFiles(outputDir, featureName, templateData) {
    const files = [];
    const featureDir = path.join(outputDir, 'lib', 'features', featureName.toLowerCase());
    const lowerFeatureName = featureName.toLowerCase();

    // Update template data with lowercase feature name for imports
    const updatedTemplateData = {
      ...templateData,
      featureNameLower: lowerFeatureName
    };

    // Generate provider file
    if (this.templates['feature_provider.dart']) {
      const providerPath = path.join(featureDir, 'presentation', 'providers', `${lowerFeatureName}_provider.dart`);
      const providerContent = this.templates['feature_provider.dart'](updatedTemplateData);
      fs.writeFileSync(providerPath, providerContent, 'utf-8');
      files.push(providerPath);
    }

    // Generate page file
    if (this.templates['feature_page.dart']) {
      const pagePath = path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`);
      const pageContent = this.templates['feature_page.dart'](updatedTemplateData);
      fs.writeFileSync(pagePath, pageContent, 'utf-8');
      files.push(pagePath);
    }

    return files;
  }

  /**
   * Generate Provider files
   * @param {string} outputDir - Output directory
   * @param {string} featureName - Feature name
   * @param {object} templateData - Template data
   * @returns {array} Generated file paths
   */
  generateProviderFiles(outputDir, featureName, templateData) {
    const files = [];
    const featureDir = path.join(outputDir, 'lib', 'features', featureName.toLowerCase());
    const lowerFeatureName = featureName.toLowerCase();

    // Update template data with lowercase feature name for imports
    const updatedTemplateData = {
      ...templateData,
      featureNameLower: lowerFeatureName
    };

    // Generate notifier file
    if (this.templates['feature_notifier.dart']) {
      const notifierPath = path.join(featureDir, 'presentation', 'notifiers', `${lowerFeatureName}_notifier.dart`);
      const notifierContent = this.templates['feature_notifier.dart'](updatedTemplateData);
      fs.writeFileSync(notifierPath, notifierContent, 'utf-8');
      files.push(notifierPath);
    }

    // Generate page file
    if (this.templates['feature_page.dart']) {
      const pagePath = path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`);
      const pageContent = this.templates['feature_page.dart'](updatedTemplateData);
      fs.writeFileSync(pagePath, pageContent, 'utf-8');
      files.push(pagePath);
    }

    return files;
  }

  /**
   * Generate GetX files
   * @param {string} outputDir - Output directory
   * @param {string} featureName - Feature name
   * @param {object} templateData - Template data
   * @returns {array} Generated file paths
   */
  generateGetXFiles(outputDir, featureName, templateData) {
    const files = [];
    const featureDir = path.join(outputDir, 'lib', 'features', featureName.toLowerCase());
    const lowerFeatureName = featureName.toLowerCase();

    // Update template data with lowercase feature name for imports
    const updatedTemplateData = {
      ...templateData,
      featureNameLower: lowerFeatureName
    };

    // Generate controller file
    if (this.templates['feature_controller.dart']) {
      const controllerPath = path.join(featureDir, 'presentation', 'controllers', `${lowerFeatureName}_controller.dart`);
      const controllerContent = this.templates['feature_controller.dart'](updatedTemplateData);
      fs.writeFileSync(controllerPath, controllerContent, 'utf-8');
      files.push(controllerPath);
    }

    // Generate binding file
    if (this.templates['feature_binding.dart']) {
      const bindingPath = path.join(featureDir, 'presentation', 'bindings', `${lowerFeatureName}_binding.dart`);
      const bindingContent = this.templates['feature_binding.dart'](updatedTemplateData);
      fs.writeFileSync(bindingPath, bindingContent, 'utf-8');
      files.push(bindingPath);
    }

    // Generate page file
    if (this.templates['feature_page.dart']) {
      const pagePath = path.join(featureDir, 'presentation', 'pages', `${lowerFeatureName}_page.dart`);
      const pageContent = this.templates['feature_page.dart'](updatedTemplateData);
      fs.writeFileSync(pagePath, pageContent, 'utf-8');
      files.push(pagePath);
    }

    return files;
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert to title case
   * @param {string} str - String to convert
   * @returns {string} Title case string
   */
  toTitle(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

module.exports = DartGenerator;
