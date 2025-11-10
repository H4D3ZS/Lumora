const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * FlutterParser - Parses Flutter/Dart files and extracts widget structure
 * Uses Dart analyzer via command line to parse Dart code
 */
class FlutterParser {
  constructor() {
    this.currentFilePath = '';
    this.stateVariables = [];
    this.eventHandlers = [];
    this.lifecycleMethods = [];
    this.componentMetadata = {};
  }

  /**
   * Parse a Dart file and extract widget structure
   * @param {string} filePath - Path to the Dart file
   * @returns {object} Parsed widget structure
   */
  parseFile(filePath) {
    try {
      this.currentFilePath = filePath;
      this.stateVariables = [];
      this.eventHandlers = [];
      this.lifecycleMethods = [];
      this.componentMetadata = {};

      const code = fs.readFileSync(filePath, 'utf-8');
      return this.parseCode(code, filePath);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parse Dart code string and extract widget structure
   * @param {string} code - Dart code as string
   * @param {string} sourceFile - Source file name (optional)
   * @returns {object} Parsed widget structure
   */
  parseCode(code, sourceFile = 'inline.dart') {
    try {
      this.currentFilePath = sourceFile;
      this.stateVariables = [];
      this.eventHandlers = [];
      this.lifecycleMethods = [];
      this.componentMetadata = {};

      // Parse the Dart code using regex-based parsing
      // This is a simplified parser - a full implementation would use the Dart analyzer
      const structure = this.extractWidgetStructure(code);
      
      return structure;
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  /**
   * Extract widget structure from Dart code
   * @param {string} code - Dart code
   * @returns {object} Widget structure
   */
  extractWidgetStructure(code) {
    // Extract class name and type
    const classMatch = code.match(/class\s+(\w+)\s+extends\s+(StatelessWidget|StatefulWidget|InheritedWidget)/);
    
    if (!classMatch) {
      throw new Error('No Flutter widget class found in the file');
    }

    const className = classMatch[1];
    const widgetType = classMatch[2];
    
    this.componentMetadata.name = className;
    this.componentMetadata.type = widgetType;
    this.componentMetadata.isStateful = widgetType === 'StatefulWidget';
    this.componentMetadata.isInherited = widgetType === 'InheritedWidget';

    // Extract dartdoc comments
    const docMatch = code.match(/\/\/\/\s*([^\n]+(?:\n\/\/\/\s*[^\n]+)*)/);
    if (docMatch) {
      this.componentMetadata.documentation = docMatch[1]
        .split('\n')
        .map(line => line.replace(/^\/\/\/\s*/, ''))
        .join('\n');
    }

    // If StatefulWidget, extract state class
    if (this.componentMetadata.isStateful) {
      this.extractStateClass(code, className);
    }

    // Extract build method
    const buildMethod = this.extractBuildMethod(code);
    
    // Extract widget tree from build method
    const widgetTree = this.extractWidgetTree(buildMethod);

    return {
      className,
      widgetType,
      documentation: this.componentMetadata.documentation,
      stateVariables: this.stateVariables,
      lifecycleMethods: this.lifecycleMethods,
      eventHandlers: this.eventHandlers,
      widgetTree,
      metadata: this.componentMetadata
    };
  }

  /**
   * Extract state class from StatefulWidget
   * @param {string} code - Dart code
   * @param {string} widgetName - Widget class name
   */
  extractStateClass(code, widgetName) {
    const stateClassName = `_${widgetName}State`;
    const stateClassRegex = new RegExp(`class\\s+${stateClassName}\\s+extends\\s+State<${widgetName}>\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, 's');
    const stateClassMatch = code.match(stateClassRegex);

    if (!stateClassMatch) {
      return;
    }

    const stateClassBody = stateClassMatch[1];

    // Extract state variables
    this.extractStateVariables(stateClassBody);

    // Extract lifecycle methods
    this.extractLifecycleMethods(stateClassBody);

    // Extract event handler methods
    this.extractEventHandlers(stateClassBody);
  }

  /**
   * Extract state variables from state class
   * @param {string} stateClassBody - State class body
   */
  extractStateVariables(stateClassBody) {
    // Match variable declarations
    const varRegex = /(?:late\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*=\s*([^;]+);/g;
    let match;

    while ((match = varRegex.exec(stateClassBody)) !== null) {
      const type = match[1];
      const name = match[2];
      const initialValue = match[3].trim();

      // Skip if it's a method or getter
      if (stateClassBody.includes(`${name}(`)) {
        continue;
      }

      this.stateVariables.push({
        name,
        type: this.mapDartTypeToTS(type),
        dartType: type,
        initialValue: this.parseDartValue(initialValue, type),
        mutable: true
      });
    }
  }

  /**
   * Extract lifecycle methods from state class
   * @param {string} stateClassBody - State class body
   */
  extractLifecycleMethods(stateClassBody) {
    // Extract initState
    const initStateMatch = stateClassBody.match(/@override\s+void\s+initState\(\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (initStateMatch) {
      this.lifecycleMethods.push({
        name: 'initState',
        type: 'mount',
        body: initStateMatch[1].trim()
      });
    }

    // Extract dispose
    const disposeMatch = stateClassBody.match(/@override\s+void\s+dispose\(\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (disposeMatch) {
      this.lifecycleMethods.push({
        name: 'dispose',
        type: 'cleanup',
        body: disposeMatch[1].trim()
      });
    }

    // Extract didUpdateWidget
    const didUpdateMatch = stateClassBody.match(/@override\s+void\s+didUpdateWidget\([^)]+\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (didUpdateMatch) {
      this.lifecycleMethods.push({
        name: 'didUpdateWidget',
        type: 'update',
        body: didUpdateMatch[1].trim()
      });
    }
  }

  /**
   * Extract event handler methods from state class
   * @param {string} stateClassBody - State class body
   */
  extractEventHandlers(stateClassBody) {
    // Match methods that are not lifecycle methods or build
    const methodRegex = /void\s+(\w+)\s*\([^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    let match;

    const lifecycleNames = ['initState', 'dispose', 'didUpdateWidget', 'build'];

    while ((match = methodRegex.exec(stateClassBody)) !== null) {
      const methodName = match[1];
      const methodBody = match[2];

      // Skip lifecycle methods and build
      if (lifecycleNames.includes(methodName)) {
        continue;
      }

      // Check if method contains setState
      const hasSetState = methodBody.includes('setState');

      this.eventHandlers.push({
        name: methodName,
        body: methodBody.trim(),
        hasSetState,
        parameters: [] // TODO: Extract parameters
      });
    }
  }

  /**
   * Extract build method from widget class
   * @param {string} code - Dart code
   * @returns {string} Build method body
   */
  extractBuildMethod(code) {
    // Match build method
    const buildRegex = /@override\s+Widget\s+build\(BuildContext\s+context\)\s*\{([\s\S]+)\s*\}\s*\}/;
    const buildMatch = code.match(buildRegex);

    if (!buildMatch) {
      throw new Error('No build method found in widget class');
    }

    return buildMatch[1].trim();
  }

  /**
   * Extract widget tree from build method
   * @param {string} buildMethod - Build method body
   * @returns {object} Widget tree structure
   */
  extractWidgetTree(buildMethod) {
    // Find the return statement
    const returnMatch = buildMethod.match(/return\s+([\s\S]+);?\s*$/);
    
    if (!returnMatch) {
      throw new Error('No return statement found in build method');
    }

    const widgetCode = returnMatch[1].trim().replace(/;$/, '');
    
    // Parse the widget tree
    return this.parseWidget(widgetCode);
  }

  /**
   * Parse a widget from Dart code
   * @param {string} widgetCode - Widget code
   * @returns {object} Widget node
   */
  parseWidget(widgetCode) {
    // Remove trailing semicolon and whitespace
    widgetCode = widgetCode.trim().replace(/;$/, '');

    // Extract widget type
    const widgetMatch = widgetCode.match(/^(\w+(?:\.\w+)?)\s*\(/);
    
    if (!widgetMatch) {
      // Might be a variable reference
      return {
        type: 'Reference',
        reference: widgetCode,
        props: {},
        children: []
      };
    }

    const widgetType = widgetMatch[1];

    // Extract props and children
    const { props, children } = this.extractPropsAndChildren(widgetCode, widgetType);

    return {
      type: widgetType,
      props,
      children,
      metadata: {
        lineNumber: 0 // TODO: Track line numbers
      }
    };
  }

  /**
   * Extract props and children from widget code
   * @param {string} widgetCode - Widget code
   * @param {string} widgetType - Widget type
   * @returns {object} Props and children
   */
  extractPropsAndChildren(widgetCode, widgetType) {
    const props = {};
    const children = [];

    // Find the opening parenthesis
    const openParenIndex = widgetCode.indexOf('(');
    if (openParenIndex === -1) {
      return { props, children };
    }

    // Extract the content between parentheses
    const content = this.extractBalancedContent(widgetCode, openParenIndex);

    // Parse named parameters
    const params = this.parseNamedParameters(content);

    for (const [key, value] of Object.entries(params)) {
      if (key === 'child') {
        // Single child
        const childWidget = this.parseWidget(value);
        children.push(childWidget);
      } else if (key === 'children') {
        // Multiple children - parse array
        const childrenArray = this.parseArrayContent(value);
        for (const childCode of childrenArray) {
          const childWidget = this.parseWidget(childCode);
          children.push(childWidget);
        }
      } else if (key.startsWith('on')) {
        // Event handler - store in props for now
        props[key] = value;
      } else {
        // Regular prop
        props[key] = this.parseDartValue(value);
      }
    }

    return { props, children };
  }

  /**
   * Extract balanced content between parentheses
   * @param {string} code - Code string
   * @param {number} startIndex - Start index (position of opening paren)
   * @returns {string} Content between parentheses
   */
  extractBalancedContent(code, startIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let content = '';

    for (let i = startIndex; i < code.length; i++) {
      const char = code[i];
      const prevChar = i > 0 ? code[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(') {
          depth++;
          if (depth > 1) {
            content += char;
          }
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            break;
          }
          content += char;
        } else if (depth > 0) {
          content += char;
        }
      } else {
        if (depth > 0) {
          content += char;
        }
      }
    }

    return content.trim();
  }

  /**
   * Parse named parameters from widget constructor
   * @param {string} content - Constructor content
   * @returns {object} Named parameters
   */
  parseNamedParameters(content) {
    const params = {};
    let currentKey = '';
    let currentValue = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let inKey = true;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(' || char === '[' || char === '{') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}') {
          depth--;
        }

        if (depth === 0) {
          if (char === ':' && inKey) {
            inKey = false;
            continue;
          } else if (char === ',') {
            // End of parameter
            if (currentKey && currentValue) {
              params[currentKey.trim()] = currentValue.trim();
            }
            currentKey = '';
            currentValue = '';
            inKey = true;
            continue;
          }
        }
      }

      if (inKey) {
        currentKey += char;
      } else {
        currentValue += char;
      }
    }

    // Add last parameter
    if (currentKey && currentValue) {
      params[currentKey.trim()] = currentValue.trim();
    }

    return params;
  }

  /**
   * Parse array content
   * @param {string} arrayCode - Array code (e.g., "[item1, item2]")
   * @returns {array} Array of items
   */
  parseArrayContent(arrayCode) {
    // Remove brackets
    arrayCode = arrayCode.trim();
    if (arrayCode.startsWith('[')) {
      arrayCode = arrayCode.slice(1);
    }
    if (arrayCode.endsWith(']')) {
      arrayCode = arrayCode.slice(0, -1);
    }

    const items = [];
    let currentItem = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < arrayCode.length; i++) {
      const char = arrayCode[i];
      const prevChar = i > 0 ? arrayCode[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(' || char === '[' || char === '{') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}') {
          depth--;
        }

        if (depth === 0 && char === ',') {
          if (currentItem.trim()) {
            items.push(currentItem.trim());
          }
          currentItem = '';
          continue;
        }
      }

      currentItem += char;
    }

    // Add last item
    if (currentItem.trim()) {
      items.push(currentItem.trim());
    }

    return items;
  }

  /**
   * Parse Dart value to JavaScript value
   * @param {string} dartValue - Dart value as string
   * @param {string} type - Dart type (optional)
   * @returns {any} JavaScript value
   */
  parseDartValue(dartValue, type = '') {
    dartValue = dartValue.trim();

    // Handle null
    if (dartValue === 'null') {
      return null;
    }

    // Handle boolean
    if (dartValue === 'true') {
      return true;
    }
    if (dartValue === 'false') {
      return false;
    }

    // Handle numbers
    if (/^-?\d+(\.\d+)?$/.test(dartValue)) {
      return parseFloat(dartValue);
    }

    // Handle strings
    if ((dartValue.startsWith("'") && dartValue.endsWith("'")) ||
        (dartValue.startsWith('"') && dartValue.endsWith('"'))) {
      return dartValue.slice(1, -1);
    }

    // Handle Color
    if (dartValue.startsWith('Color(0x')) {
      const hex = dartValue.match(/0x([0-9A-Fa-f]+)/);
      if (hex) {
        // Convert to hex color
        const colorValue = hex[1];
        return `#${colorValue.slice(2)}`; // Remove alpha channel
      }
    }

    // Handle Colors constants
    if (dartValue.startsWith('Colors.')) {
      return dartValue.replace('Colors.', '');
    }

    // Handle EdgeInsets
    if (dartValue.startsWith('EdgeInsets.')) {
      const allMatch = dartValue.match(/EdgeInsets\.all\(([^)]+)\)/);
      if (allMatch) {
        return parseFloat(allMatch[1]);
      }
    }

    // Handle arrays
    if (dartValue.startsWith('[') && dartValue.endsWith(']')) {
      return this.parseArrayContent(dartValue);
    }

    // Handle objects/maps
    if (dartValue.startsWith('{') && dartValue.endsWith('}')) {
      // Simplified object parsing
      return dartValue;
    }

    // Handle variable references
    if (/^[a-zA-Z_]\w*$/.test(dartValue)) {
      return `{{${dartValue}}}`;
    }

    // Return as-is for complex expressions
    return dartValue;
  }

  /**
   * Map Dart type to TypeScript type
   * @param {string} dartType - Dart type
   * @returns {string} TypeScript type
   */
  mapDartTypeToTS(dartType) {
    const typeMap = {
      'String': 'string',
      'int': 'number',
      'double': 'number',
      'num': 'number',
      'bool': 'boolean',
      'List': 'array',
      'Map': 'object',
      'dynamic': 'any',
      'Object': 'any'
    };

    // Handle generic types
    const genericMatch = dartType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
      const baseType = genericMatch[1];
      if (baseType === 'List') {
        return 'array';
      }
      if (baseType === 'Map') {
        return 'object';
      }
    }

    return typeMap[dartType] || 'any';
  }
}

module.exports = FlutterParser;
