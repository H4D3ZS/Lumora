const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const SchemaToDart = require('./schema-to-dart');

/**
 * DartGenerator - Generates Dart code with Clean Architecture structure
 */
class DartGenerator {
  constructor(adapter = 'bloc') {
    this.adapter = adapter;
    this.schemaToDart = new SchemaToDart();
    this.templates = {};
    
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
    const widgetCode = this.schemaToDart.convertToDart(schema);

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
    switch (this.adapter) {
      case 'bloc':
        generatedFiles.push(...this.generateBlocFiles(outputDir, featureName, templateData));
        break;
      case 'riverpod':
        generatedFiles.push(...this.generateRiverpodFiles(outputDir, featureName, templateData));
        break;
      case 'provider':
        generatedFiles.push(...this.generateProviderFiles(outputDir, featureName, templateData));
        break;
      case 'getx':
        generatedFiles.push(...this.generateGetXFiles(outputDir, featureName, templateData));
        break;
    }

    return generatedFiles;
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
