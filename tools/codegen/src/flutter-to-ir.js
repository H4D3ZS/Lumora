const fs = require('fs');
const path = require('path');
const FlutterParser = require('./flutter-parser');
const StateManagementDetector = require('./state-management-detector');

/**
 * FlutterToIR - Converts Flutter/Dart code to Lumora IR
 */
class FlutterToIR {
  constructor() {
    this.parser = new FlutterParser();
    this.stateManagementDetector = new StateManagementDetector();
  }

  /**
   * Parse a Flutter file and convert to Lumora IR
   * @param {string} filePath - Path to the Dart file
   * @returns {object} Lumora IR
   */
  parseFile(filePath) {
    try {
      const structure = this.parser.parseFile(filePath);
      return this.structureToIR(structure, filePath);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse Flutter code string and convert to Lumora IR
   * @param {string} code - Dart code as string
   * @param {string} sourceFile - Source file name (optional)
   * @returns {object} Lumora IR
   */
  parseCode(code, sourceFile = 'inline.dart') {
    try {
      const structure = this.parser.parseCode(code, sourceFile);
      return this.structureToIR(structure, sourceFile);
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  /**
   * Convert parsed Flutter structure to Lumora IR
   * @param {object} structure - Parsed Flutter structure
   * @param {string} sourceFile - Source file path
   * @returns {object} Lumora IR
   */
  structureToIR(structure, sourceFile) {
    // Convert widget tree to IR nodes
    const nodes = [this.widgetToNode(structure.widgetTree)];

    // Detect state management pattern
    const sourceCode = fs.readFileSync(sourceFile, 'utf-8');
    const statePattern = this.stateManagementDetector.detectFlutterPattern(sourceCode, structure.metadata);

    // Detect navigation
    const navigationInfo = this.detectFlutterNavigation(sourceCode, structure);

    // Build IR metadata
    const metadata = {
      sourceFramework: 'flutter',
      sourceFile,
      generatedAt: Date.now(),
      irVersion: '1.0.0',
      componentName: structure.className,
      documentation: structure.documentation,
      widgetType: structure.widgetType,
      isStateful: structure.metadata.isStateful,
      isInherited: structure.metadata.isInherited,
      stateManagement: {
        pattern: statePattern.pattern,
        confidence: statePattern.confidence,
        features: statePattern.features,
        targetPattern: this.stateManagementDetector.mapFlutterToReact(statePattern.pattern)
      },
      navigation: navigationInfo
    };

    // Add Flutter-specific metadata
    if (structure.metadata.isStateful) {
      metadata.flutter = {
        stateVariables: structure.stateVariables,
        lifecycleMethods: structure.lifecycleMethods,
        eventHandlers: structure.eventHandlers
      };
    }

    // Create IR
    const ir = {
      version: '1.0.0',
      metadata,
      nodes
    };

    return ir;
  }

  /**
   * Detect Flutter navigation patterns
   * @param {string} sourceCode - Flutter source code
   * @param {object} structure - Parsed structure
   * @returns {object} Navigation information
   */
  detectFlutterNavigation(sourceCode, structure) {
    const navigationInfo = {
      hasNavigation: false,
      library: 'flutter-navigator',
      routes: [],
      navigateCalls: [],
      linkComponents: [],
      deepLinking: {
        enabled: false,
        urlPatterns: []
      }
    };

    // Check for MaterialApp with routes
    if (sourceCode.includes('MaterialApp') && sourceCode.includes('routes:')) {
      navigationInfo.hasNavigation = true;

      // Extract route definitions
      const routesMatch = sourceCode.match(/routes:\s*\{([^}]+)\}/s);
      if (routesMatch) {
        const routesContent = routesMatch[1];
        // Match route patterns: '/path': (context) => Widget()
        const routeMatches = routesContent.matchAll(/['"]([^'"]+)['"]\s*:\s*\([^)]*\)\s*=>\s*(\w+)\(/g);
        
        for (const match of routeMatches) {
          navigationInfo.routes.push({
            path: match[1],
            component: match[2],
            exact: false,
            params: []
          });
        }
      }
    }

    // Check for Navigator calls
    if (sourceCode.includes('Navigator.')) {
      navigationInfo.hasNavigation = true;

      // Extract Navigator.pushNamed calls
      const pushNamedMatches = sourceCode.matchAll(/Navigator\.pushNamed\([^,]+,\s*['"]([^'"]+)['"]/g);
      for (const match of pushNamedMatches) {
        navigationInfo.navigateCalls.push({
          method: 'pushNamed',
          path: match[1],
          params: {}
        });
      }

      // Extract Navigator.pushReplacementNamed calls
      const replaceMatches = sourceCode.matchAll(/Navigator\.pushReplacementNamed\([^,]+,\s*['"]([^'"]+)['"]/g);
      for (const match of replaceMatches) {
        navigationInfo.navigateCalls.push({
          method: 'pushReplacementNamed',
          path: match[1],
          params: {}
        });
      }

      // Extract Navigator.pop calls
      if (sourceCode.includes('Navigator.pop')) {
        navigationInfo.navigateCalls.push({
          method: 'pop',
          path: null,
          params: {}
        });
      }
    }

    // Check for deep linking configuration
    if (sourceCode.includes('onGenerateRoute') || 
        sourceCode.includes('initialRoute') ||
        sourceCode.includes('uni_links') ||
        sourceCode.includes('app_links')) {
      navigationInfo.deepLinking.enabled = true;
      
      // Extract URL patterns from routes
      for (const route of navigationInfo.routes) {
        if (route.path) {
          // Convert Flutter route path to URL pattern
          const urlPattern = route.path;
          navigationInfo.deepLinking.urlPatterns.push({
            path: route.path,
            urlPattern: urlPattern,
            component: route.component
          });
        }
      }
    }

    return navigationInfo;
  }

  /**
   * Convert Flutter widget to IR node
   * @param {object} widget - Flutter widget structure
   * @returns {object} IR node
   */
  widgetToNode(widget) {
    if (!widget) {
      throw new Error('No widget provided for conversion');
    }

    // Handle variable references
    if (widget.type === 'Reference') {
      return {
        id: this.generateNodeId(),
        type: 'Reference',
        props: {
          reference: widget.reference
        },
        children: [],
        metadata: {
          lineNumber: widget.metadata?.lineNumber || 0
        }
      };
    }

    // Extract event handlers from props
    const events = this.extractEvents(widget.props);
    
    // Remove event handlers from props
    const props = { ...widget.props };
    for (const event of events) {
      delete props[event.name];
    }

    // Convert children
    const children = widget.children.map(child => this.widgetToNode(child));

    // Create IR node
    const node = {
      id: this.generateNodeId(),
      type: widget.type,
      props,
      children,
      metadata: {
        lineNumber: widget.metadata?.lineNumber || 0
      }
    };

    // Add events if present
    if (events.length > 0) {
      node.events = events;
    }

    return node;
  }

  /**
   * Extract event handlers from widget props
   * @param {object} props - Widget props
   * @returns {array} Array of event definitions
   */
  extractEvents(props) {
    const events = [];

    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on')) {
        events.push({
          name: key,
          handler: this.extractHandlerCode(value),
          parameters: [] // TODO: Extract parameters from handler
        });
      }
    }

    return events;
  }

  /**
   * Extract handler code from prop value
   * @param {string} value - Prop value
   * @returns {string} Handler code
   */
  extractHandlerCode(value) {
    if (typeof value !== 'string') {
      return 'handler';
    }

    // If it's a method reference
    if (/^[a-zA-Z_]\w*$/.test(value)) {
      return value;
    }

    // If it's an inline function
    if (value.includes('=>') || value.includes('()')) {
      return value;
    }

    return value;
  }

  /**
   * Generate unique node ID
   * @returns {string} Node ID
   */
  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Write IR to JSON file
   * @param {object} ir - Lumora IR
   * @param {string} outputPath - Path to output JSON file
   */
  writeIRToFile(ir, outputPath) {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const jsonString = JSON.stringify(ir, null, 2);
      fs.writeFileSync(outputPath, jsonString, 'utf-8');
      
      console.log(`✓ Lumora IR generated successfully: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to write IR to file ${outputPath}: ${error.message}`);
    }
  }

  /**
   * Convert Flutter file to Lumora IR and write to output file
   * @param {string} inputPath - Path to input Dart file
   * @param {string} outputPath - Path to output JSON file
   * @returns {object} Generated IR object
   */
  convertFileToIR(inputPath, outputPath) {
    try {
      const ir = this.parseFile(inputPath);
      this.writeIRToFile(ir, outputPath);
      return ir;
    } catch (error) {
      console.error(`✗ Error converting Flutter to IR: ${error.message}`);
      throw error;
    }
  }
}

module.exports = FlutterToIR;
