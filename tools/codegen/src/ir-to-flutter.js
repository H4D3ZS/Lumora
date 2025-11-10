const fs = require('fs');
const path = require('path');

/**
 * IRToFlutter - Converts Lumora IR to Flutter/Dart code
 */
class IRToFlutter {
  constructor() {
    this.widgetMappings = {};
    this.imports = new Set();
    this.stateVariables = [];
    this.eventHandlers = [];
    this.indentLevel = 0;
  }

  /**
   * Load widget mappings from JSON file
   * @param {string} mappingPath - Path to widget mapping JSON file
   */
  loadMappings(mappingPath) {
    try {
      const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
      this.widgetMappings = JSON.parse(mappingContent);
    } catch (error) {
      throw new Error(`Failed to load widget mappings: ${error.message}`);
    }
  }

  /**
   * Convert Lumora IR to Flutter Dart code
   * @param {object} ir - Lumora IR object
   * @returns {string} Generated Dart code
   */
  convertToFlutter(ir) {
    // Reset state
    this.imports = new Set(['package:flutter/material.dart']);
    this.stateVariables = [];
    this.eventHandlers = [];
    this.effects = [];
    this.callbacks = [];
    this.memos = [];
    this.contexts = [];
    this.contextDefinitions = [];
    this.navigationInfo = null;
    this.indentLevel = 0;
    this.stateManagementPattern = null;

    // Extract component metadata
    const componentName = ir.metadata.componentName || 'GeneratedWidget';
    this.currentWidgetName = componentName;
    const documentation = ir.metadata.documentation;

    // Extract navigation information
    if (ir.metadata.navigation && ir.metadata.navigation.hasNavigation) {
      this.navigationInfo = ir.metadata.navigation;
    }

    // Extract state management pattern
    if (ir.metadata.stateManagement) {
      this.stateManagementPattern = ir.metadata.stateManagement;
      
      // Add appropriate imports based on pattern
      if (this.stateManagementPattern.targetPattern === 'bloc') {
        this.imports.add('package:flutter_bloc/flutter_bloc.dart');
      } else if (this.stateManagementPattern.targetPattern === 'riverpod') {
        this.imports.add('package:flutter_riverpod/flutter_riverpod.dart');
      } else if (this.stateManagementPattern.targetPattern === 'provider') {
        this.imports.add('package:provider/provider.dart');
      } else if (this.stateManagementPattern.targetPattern === 'getx') {
        this.imports.add('package:get/get.dart');
      }
    }

    // Extract hooks from metadata
    if (ir.metadata.hooks) {
      this.stateVariables = ir.metadata.hooks.state || [];
      this.effects = ir.metadata.hooks.effects || [];
      this.callbacks = ir.metadata.hooks.callbacks || [];
      this.memos = ir.metadata.hooks.memos || [];
      this.contexts = ir.metadata.hooks.contexts || [];
    }

    // Extract context definitions
    if (ir.metadata.contextDefinitions) {
      this.contextDefinitions = ir.metadata.contextDefinitions;
    }

    // Collect additional state variables and events from nodes
    this.collectStateVariables(ir.nodes);

    // Check if this is a context provider
    const isContextProvider = this.detectContextProvider(ir.nodes);

    // Determine if we need a StatefulWidget
    const isStateful = this.stateVariables.length > 0 || 
                       this.eventHandlers.length > 0 || 
                       this.effects.length > 0;

    // Generate the widget code
    let code = '';

    // Add file header comment
    if (documentation) {
      code += this.formatDocComment(documentation);
    }

    // Add state management pattern comment
    if (this.stateManagementPattern && this.stateManagementPattern.pattern !== 'useState') {
      code += `/// Converted from React ${this.stateManagementPattern.pattern} pattern\n`;
      code += `/// Target Flutter pattern: ${this.stateManagementPattern.targetPattern}\n`;
      code += `/// Confidence: ${(this.stateManagementPattern.confidence * 100).toFixed(0)}%\n`;
    }

    // Add imports
    code += this.generateImports();
    code += '\n';

    // Generate InheritedWidget for context definitions
    if (this.contextDefinitions.length > 0) {
      for (const contextDef of this.contextDefinitions) {
        code += this.generateInheritedWidget(contextDef);
        code += '\n';
      }
    }

    // Generate widget class based on state management pattern
    if (this.stateManagementPattern && this.stateManagementPattern.targetPattern !== 'setState') {
      code += this.generateComplexStateManagementWidget(componentName, ir.nodes);
    } else if (isContextProvider) {
      code += this.generateContextProviderWidget(componentName, ir.nodes);
    } else if (isStateful) {
      code += this.generateStatefulWidget(componentName, ir.nodes);
    } else {
      code += this.generateStatelessWidget(componentName, ir.nodes);
    }

    // Format the code (basic formatting)
    return this.formatDartCode(code);
  }

  /**
   * Generate widget with complex state management pattern
   * @param {string} name - Widget name
   * @param {array} nodes - IR nodes
   * @returns {string} Widget code
   */
  generateComplexStateManagementWidget(name, nodes) {
    const pattern = this.stateManagementPattern.targetPattern;
    
    let code = `// TODO: Implement ${pattern} pattern\n`;
    code += `// This component uses ${pattern} for state management\n`;
    code += `// Please refer to ${pattern} documentation for proper implementation\n\n`;
    
    // For now, fall back to StatefulWidget with comments
    code += `// Temporary StatefulWidget implementation\n`;
    code += `// Replace with proper ${pattern} implementation\n`;
    code += this.generateStatefulWidget(name, nodes);
    
    return code;
  }

  /**
   * Collect all state variables from IR nodes
   * @param {array} nodes - Array of IR nodes
   */
  collectStateVariables(nodes) {
    for (const node of nodes) {
      if (node.state && node.state.variables) {
        for (const stateVar of node.state.variables) {
          // Avoid duplicates
          if (!this.stateVariables.find(v => v.name === stateVar.name)) {
            this.stateVariables.push(stateVar);
          }
        }
      }

      if (node.events) {
        for (const event of node.events) {
          if (!this.eventHandlers.find(e => e.handler === event.handler)) {
            this.eventHandlers.push(event);
          }
        }
      }

      // Recursively collect from children
      if (node.children && node.children.length > 0) {
        this.collectStateVariables(node.children);
      }
    }
  }

  /**
   * Detect if nodes contain a Context.Provider
   * @param {array} nodes - Array of IR nodes
   * @returns {boolean} True if context provider found
   */
  detectContextProvider(nodes) {
    for (const node of nodes) {
      if (node.metadata && node.metadata.isContextProvider) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (this.detectContextProvider(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Generate InheritedWidget for context
   * @param {object} contextDef - Context definition
   * @returns {string} InheritedWidget code
   */
  generateInheritedWidget(contextDef) {
    const contextName = contextDef.name.replace('Context', '');
    const className = `${contextName}InheritedWidget`;

    let code = `class ${className} extends InheritedWidget {\n`;
    code += `  const ${className}({\n`;
    code += `    Key? key,\n`;
    code += `    required this.data,\n`;
    code += `    required Widget child,\n`;
    code += `  }) : super(key: key, child: child);\n\n`;
    code += `  final Map<String, dynamic> data;\n\n`;
    code += `  static ${className}? of(BuildContext context) {\n`;
    code += `    return context.dependOnInheritedWidgetOfExactType<${className}>();\n`;
    code += `  }\n\n`;
    code += `  @override\n`;
    code += `  bool updateShouldNotify(${className} oldWidget) {\n`;
    code += `    return data != oldWidget.data;\n`;
    code += `  }\n`;
    code += `}\n\n`;

    return code;
  }

  /**
   * Generate context provider widget
   * @param {string} name - Widget name
   * @param {array} nodes - IR nodes
   * @returns {string} Widget code
   */
  generateContextProviderWidget(name, nodes) {
    let code = `class ${name} extends StatefulWidget {\n`;
    code += `  const ${name}({Key? key, this.children}) : super(key: key);\n\n`;
    code += `  final Widget? children;\n\n`;
    code += `  @override\n`;
    code += `  State<${name}> createState() => _${name}State();\n`;
    code += `}\n\n`;

    code += `class _${name}State extends State<${name}> {\n`;

    // Add state variables
    for (const stateVar of this.stateVariables) {
      const dartType = this.mapTypeToDart(stateVar.type);
      const initialValue = this.formatDartValue(stateVar.initialValue, stateVar.type);
      code += `  ${dartType} ${stateVar.name} = ${initialValue};\n`;
    }

    if (this.stateVariables.length > 0) {
      code += '\n';
    }

    // Add build method that wraps children in InheritedWidget
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    // TODO: Wrap with InheritedWidget\n`;
    code += `    return widget.children ?? Container();\n`;
    code += `  }\n`;
    code += `}\n`;

    return code;
  }

  /**
   * Format documentation comment
   * @param {string} doc - Documentation string
   * @returns {string} Formatted doc comment
   */
  formatDocComment(doc) {
    const lines = doc.split('\n').map(line => line.trim());
    return '/// ' + lines.join('\n/// ') + '\n';
  }

  /**
   * Generate imports section
   * @returns {string} Import statements
   */
  generateImports() {
    return Array.from(this.imports).map(imp => `import '${imp}';`).join('\n');
  }

  /**
   * Generate StatelessWidget
   * @param {string} name - Widget name
   * @param {array} nodes - IR nodes
   * @returns {string} Widget code
   */
  generateStatelessWidget(name, nodes) {
    let code = `class ${name} extends StatelessWidget {\n`;
    code += `  const ${name}({Key? key}) : super(key: key);\n\n`;
    
    // If this component has navigation, generate route configuration
    if (this.navigationInfo && this.navigationInfo.routes.length > 0) {
      code += this.generateRouteConfiguration();
    }
    
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    
    // Add context access if useContext is used
    if (this.contexts && this.contexts.length > 0) {
      for (const context of this.contexts) {
        const contextName = context.contextType.replace('Context', '');
        code += `    final ${context.name} = ${contextName}InheritedWidget.of(context)?.data;\n`;
      }
      code += '\n';
    }
    
    // If this component has navigation, wrap in MaterialApp with routes
    if (this.navigationInfo && this.navigationInfo.routes.length > 0) {
      code += `    return MaterialApp(\n`;
      code += `      initialRoute: '${this.navigationInfo.routes[0]?.path || '/'}',\n`;
      code += `      routes: routes,\n`;
      code += `    );\n`;
    } else {
      code += `    return ${this.generateWidgetTree(nodes[0], 2)};\n`;
    }
    
    code += `  }\n`;
    code += `}\n`;
    return code;
  }

  /**
   * Generate route configuration from React Router routes
   * Handles nested routes by creating separate route entries
   * Includes deep linking configuration if enabled
   * @returns {string} Route configuration code
   */
  generateRouteConfiguration() {
    let code = `  // Route configuration converted from React Router\n`;
    
    // Check if there are nested routes
    const hasNestedRoutes = this.navigationInfo.routes.some(r => r.children && r.children.length > 0);
    
    if (hasNestedRoutes) {
      code += `  // Note: Nested routes detected. Consider using onGenerateRoute for complex navigation.\n`;
    }
    
    // Add deep linking configuration if enabled
    if (this.navigationInfo.deepLinking && this.navigationInfo.deepLinking.enabled) {
      code += `  // Deep linking enabled - configure in AndroidManifest.xml and Info.plist\n`;
      code += `  // URL patterns:\n`;
      for (const pattern of this.navigationInfo.deepLinking.urlPatterns) {
        code += `  //   ${pattern.urlPattern} -> ${pattern.component}\n`;
      }
      code += `\n`;
    }
    
    code += `  static final Map<String, WidgetBuilder> routes = {\n`;
    
    for (const route of this.navigationInfo.routes) {
      const routePath = route.path || '/';
      const componentName = route.component || 'Container';
      
      code += `    '${routePath}': (context) => ${componentName}(),\n`;
      
      // Add comment for route parameters
      if (route.params.length > 0) {
        code += `    // Route parameters: ${route.params.join(', ')}\n`;
        code += `    // Access with: ModalRoute.of(context)?.settings.arguments\n`;
      }
      
      // Add nested routes as separate entries with combined paths
      if (route.children && route.children.length > 0) {
        code += `    // Nested routes under ${routePath}:\n`;
        for (const child of route.children) {
          if (child.type === 'nested-route') {
            code += `    // TODO: Implement nested route - consider using Navigator within ${componentName}\n`;
          }
        }
      }
    }
    
    code += `  };\n\n`;
    
    // Add deep linking handler if enabled
    if (this.navigationInfo.deepLinking && this.navigationInfo.deepLinking.enabled) {
      code += this.generateDeepLinkHandler();
    }
    
    return code;
  }

  /**
   * Generate deep link handler for Flutter
   * @returns {string} Deep link handler code
   */
  generateDeepLinkHandler() {
    let code = `  // Deep link handler\n`;
    code += `  // Add this to your MaterialApp:\n`;
    code += `  // onGenerateRoute: (settings) {\n`;
    code += `  //   final uri = Uri.parse(settings.name ?? '/');\n`;
    code += `  //   // Parse URI and extract parameters\n`;
    code += `  //   // Return appropriate route based on URI path\n`;
    code += `  // }\n\n`;
    
    code += `  // Configure deep links in:\n`;
    code += `  // Android: android/app/src/main/AndroidManifest.xml\n`;
    code += `  // iOS: ios/Runner/Info.plist\n\n`;
    
    return code;
  }

  /**
   * Generate StatefulWidget
   * @param {string} name - Widget name
   * @param {array} nodes - IR nodes
   * @returns {string} Widget code
   */
  generateStatefulWidget(name, nodes) {
    let code = `class ${name} extends StatefulWidget {\n`;
    code += `  const ${name}({Key? key}) : super(key: key);\n\n`;
    code += `  @override\n`;
    code += `  State<${name}> createState() => _${name}State();\n`;
    code += `}\n\n`;

    code += `class _${name}State extends State<${name}> {\n`;

    // Add state variables
    for (const stateVar of this.stateVariables) {
      const dartType = this.mapTypeToDart(stateVar.type);
      const initialValue = this.formatDartValue(stateVar.initialValue, stateVar.type);
      code += `  ${dartType} ${stateVar.name} = ${initialValue};\n`;
    }

    if (this.stateVariables.length > 0) {
      code += '\n';
    }

    // Add lifecycle methods from useEffect hooks
    if (this.effects && this.effects.length > 0) {
      code += this.generateLifecycleMethods();
    }

    // Add event handler methods
    for (const handler of this.eventHandlers) {
      code += this.generateEventHandlerMethod(handler);
    }

    // Add callback methods from useCallback
    if (this.callbacks && this.callbacks.length > 0) {
      for (const callback of this.callbacks) {
        code += this.generateCallbackMethod(callback);
      }
    }

    // Add computed properties from useMemo
    if (this.memos && this.memos.length > 0) {
      for (const memo of this.memos) {
        code += this.generateMemoGetter(memo);
      }
    }

    // Add build method
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return ${this.generateWidgetTree(nodes[0], 2)};\n`;
    code += `  }\n`;
    code += `}\n`;

    return code;
  }

  /**
   * Generate lifecycle methods from useEffect hooks
   * @returns {string} Lifecycle methods code
   */
  generateLifecycleMethods() {
    let code = '';
    
    // Find mount effects (empty dependency array)
    const mountEffects = this.effects.filter(e => e.type === 'mount');
    if (mountEffects.length > 0) {
      code += `  @override\n`;
      code += `  void initState() {\n`;
      code += `    super.initState();\n`;
      code += `    // Converted from React useEffect with empty dependency array\n`;
      for (const effect of mountEffects) {
        code += `    // TODO: Implement mount effect logic\n`;
        if (effect.dependencies && effect.dependencies.length === 0) {
          code += `    // This effect runs once on mount\n`;
        }
      }
      code += `  }\n\n`;
    }

    // Find effects with cleanup
    const cleanupEffects = this.effects.filter(e => e.hasCleanup);
    if (cleanupEffects.length > 0) {
      code += `  @override\n`;
      code += `  void dispose() {\n`;
      code += `    // Converted from React useEffect cleanup function\n`;
      for (const effect of cleanupEffects) {
        code += `    // TODO: Implement cleanup logic\n`;
      }
      code += `    super.dispose();\n`;
      code += `  }\n\n`;
    }

    // Find update effects (with dependencies)
    const updateEffects = this.effects.filter(e => e.type === 'update');
    if (updateEffects.length > 0) {
      code += `  @override\n`;
      code += `  void didUpdateWidget(covariant ${this.currentWidgetName} oldWidget) {\n`;
      code += `    super.didUpdateWidget(oldWidget);\n`;
      code += `    // Converted from React useEffect with dependencies\n`;
      for (const effect of updateEffects) {
        if (effect.dependencies && effect.dependencies.length > 0) {
          code += `    // Check if dependencies changed: ${effect.dependencies.join(', ')}\n`;
          code += `    // TODO: Implement effect logic when dependencies change\n`;
        }
      }
      code += `  }\n\n`;
    }

    return code;
  }

  /**
   * Generate event handler method
   * @param {object} event - Event definition
   * @returns {string} Method code
   */
  generateEventHandlerMethod(event) {
    const handlerName = this.extractHandlerName(event.handler);
    
    // Check if handler references state variables
    const referencedState = this.findReferencedStateVariables(event.handler);
    
    let code = `  void ${handlerName}() {\n`;
    
    if (referencedState.length > 0) {
      code += `    setState(() {\n`;
      code += `      // TODO: Implement ${handlerName}\n`;
      code += `      // Referenced state: ${referencedState.join(', ')}\n`;
      code += `    });\n`;
    } else {
      code += `    // TODO: Implement ${handlerName}\n`;
    }
    
    code += `  }\n\n`;
    return code;
  }

  /**
   * Extract handler name from handler code
   * @param {string} handler - Handler code
   * @returns {string} Handler name
   */
  extractHandlerName(handler) {
    // If it's a simple identifier, return it
    if (/^[a-zA-Z_]\w*$/.test(handler)) {
      return handler;
    }
    
    // If it's a function expression, generate a name
    return 'handleEvent';
  }

  /**
   * Find state variables referenced in handler code
   * @param {string} handler - Handler code
   * @returns {array} Array of state variable names
   */
  findReferencedStateVariables(handler) {
    const referenced = [];
    
    for (const stateVar of this.stateVariables) {
      if (handler.includes(stateVar.name) || handler.includes(stateVar.setter)) {
        referenced.push(stateVar.name);
      }
    }
    
    return referenced;
  }

  /**
   * Generate callback method from useCallback
   * @param {object} callback - Callback definition
   * @returns {string} Method code
   */
  generateCallbackMethod(callback) {
    let code = `  void ${callback.name}() {\n`;
    code += `    // TODO: Implement ${callback.name}\n`;
    if (callback.dependencies.length > 0) {
      code += `    // Dependencies: ${callback.dependencies.join(', ')}\n`;
    }
    code += `  }\n\n`;
    return code;
  }

  /**
   * Generate getter for useMemo
   * @param {object} memo - Memo definition
   * @returns {string} Getter code
   */
  generateMemoGetter(memo) {
    let code = `  dynamic get ${memo.name} {\n`;
    code += `    // TODO: Implement computed value\n`;
    if (memo.dependencies.length > 0) {
      code += `    // Dependencies: ${memo.dependencies.join(', ')}\n`;
    }
    code += `    return null;\n`;
    code += `  }\n\n`;
    return code;
  }

  /**
   * Generate widget tree from IR node
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateWidgetTree(node, indent = 0) {
    const indentStr = '  '.repeat(indent);
    const mapping = this.widgetMappings[node.type];

    if (!mapping) {
      // Fallback for unmapped widgets
      console.warn(`Warning: No mapping found for widget type: ${node.type}`);
      return `${indentStr}Container() // TODO: Map ${node.type}`;
    }

    const dartWidget = mapping.dart;
    let code = '';

    // Handle different widget types
    if (dartWidget === 'Container') {
      code = this.generateContainer(node, indent);
    } else if (dartWidget === 'Text') {
      code = this.generateText(node, indent);
    } else if (dartWidget === 'ElevatedButton') {
      code = this.generateButton(node, indent);
    } else if (dartWidget === 'ListView') {
      code = this.generateListView(node, indent);
    } else if (dartWidget === 'TextField') {
      code = this.generateTextField(node, indent);
    } else if (dartWidget === 'Image.network') {
      code = this.generateImage(node, indent);
    } else {
      // Generic widget generation
      code = this.generateGenericWidget(node, indent);
    }

    return code;
  }

  /**
   * Generate Container widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateContainer(node, indent) {
    const indentStr = '  '.repeat(indent);
    
    // Check if this is a flexbox layout that should be converted to Row/Column
    const style = node.props.style || {};
    if (style.display === 'flex' || style.flexDirection) {
      return this.generateFlexboxLayout(node, indent);
    }
    
    // Check if this container has click/tap events
    const hasClickEvent = node.events && node.events.some(e => 
      e.name === 'onPress' || 
      e.name === 'onClick' || 
      e.name === 'onTap'
    );
    
    // If it has click events, wrap in GestureDetector
    if (hasClickEvent) {
      const clickEvent = node.events.find(e => 
        e.name === 'onPress' || 
        e.name === 'onClick' || 
        e.name === 'onTap'
      );
      const handler = this.convertReactEventToFlutter(clickEvent);
      
      let code = `${indentStr}GestureDetector(\n`;
      code += `${indentStr}  onTap: ${handler},\n`;
      code += `${indentStr}  child: Container(\n`;
      
      // Add container properties with extra indent
      code += this.generateContainerProperties(node, indent + 2);
      
      code += `${indentStr}  ),\n`;
      code += `${indentStr})`;
      return code;
    }
    
    // Regular container without events
    let code = `${indentStr}Container(\n`;
    code += this.generateContainerProperties(node, indent);
    code += `${indentStr})`;
    return code;
  }

  /**
   * Generate flexbox layout (Row/Column)
   * Converts React flexbox to Flutter Row/Column with proper alignment
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateFlexboxLayout(node, indent) {
    const indentStr = '  '.repeat(indent);
    const style = node.props.style || {};
    
    // Determine if it's a Row or Column based on flexDirection
    const flexDirection = style.flexDirection || 'row';
    const isColumn = flexDirection === 'column' || flexDirection === 'column-reverse';
    const widgetType = isColumn ? 'Column' : 'Row';
    
    let code = `${indentStr}${widgetType}(\n`;
    
    // Convert justifyContent to mainAxisAlignment
    if (style.justifyContent) {
      const mainAxisAlignment = this.convertJustifyContent(style.justifyContent);
      code += `${indentStr}  mainAxisAlignment: ${mainAxisAlignment},\n`;
    }
    
    // Convert alignItems to crossAxisAlignment
    if (style.alignItems) {
      const crossAxisAlignment = this.convertAlignItems(style.alignItems);
      code += `${indentStr}  crossAxisAlignment: ${crossAxisAlignment},\n`;
    }
    
    // Handle mainAxisSize
    if (style.flex || style.flexGrow) {
      code += `${indentStr}  mainAxisSize: MainAxisSize.max,\n`;
    }
    
    // Add children
    if (node.children.length > 0) {
      code += `${indentStr}  children: [\n`;
      for (const child of node.children) {
        // Check if child has flex property
        const childStyle = child.props.style || {};
        if (childStyle.flex || childStyle.flexGrow) {
          code += `${indentStr}    Expanded(\n`;
          code += `${indentStr}      flex: ${childStyle.flex || childStyle.flexGrow || 1},\n`;
          code += `${indentStr}      child: ${this.generateWidgetTree(child, indent + 3).trim()},\n`;
          code += `${indentStr}    ),\n`;
        } else {
          code += `${this.generateWidgetTree(child, indent + 2)},\n`;
        }
      }
      code += `${indentStr}  ],\n`;
    }
    
    code += `${indentStr})`;
    return code;
  }

  /**
   * Convert justifyContent to MainAxisAlignment
   * @param {string} justifyContent - CSS justify-content value
   * @returns {string} MainAxisAlignment code
   */
  convertJustifyContent(justifyContent) {
    const alignmentMap = {
      'flex-start': 'MainAxisAlignment.start',
      'flex-end': 'MainAxisAlignment.end',
      'center': 'MainAxisAlignment.center',
      'space-between': 'MainAxisAlignment.spaceBetween',
      'space-around': 'MainAxisAlignment.spaceAround',
      'space-evenly': 'MainAxisAlignment.spaceEvenly'
    };
    return alignmentMap[justifyContent] || 'MainAxisAlignment.start';
  }

  /**
   * Convert alignItems to CrossAxisAlignment
   * @param {string} alignItems - CSS align-items value
   * @returns {string} CrossAxisAlignment code
   */
  convertAlignItems(alignItems) {
    const alignmentMap = {
      'flex-start': 'CrossAxisAlignment.start',
      'flex-end': 'CrossAxisAlignment.end',
      'center': 'CrossAxisAlignment.center',
      'stretch': 'CrossAxisAlignment.stretch',
      'baseline': 'CrossAxisAlignment.baseline'
    };
    return alignmentMap[alignItems] || 'CrossAxisAlignment.start';
  }

  /**
   * Generate Container properties
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Container properties code
   */
  generateContainerProperties(node, indent) {
    const indentStr = '  '.repeat(indent);
    let code = '';

    // Convert React style object to Flutter BoxDecoration
    const style = node.props.style || {};
    const hasDecoration = node.props.backgroundColor || 
                          style.backgroundColor || 
                          style.borderRadius || 
                          style.border ||
                          style.boxShadow;

    if (hasDecoration) {
      code += `${indentStr}  decoration: ${this.convertStyleToBoxDecoration(node.props, indent + 1)},\n`;
    }

    // Add padding - handle both simple and complex padding
    const padding = this.convertPaddingToEdgeInsets(node.props.padding || style.padding);
    if (padding) {
      code += `${indentStr}  padding: ${padding},\n`;
    }

    // Add margin - handle both simple and complex margin
    const margin = this.convertMarginToEdgeInsets(node.props.margin || style.margin);
    if (margin) {
      code += `${indentStr}  margin: ${margin},\n`;
    }

    // Add width and height
    const width = node.props.width || style.width;
    const height = node.props.height || style.height;
    
    if (width) {
      code += `${indentStr}  width: ${this.convertDimension(width)},\n`;
    }
    if (height) {
      code += `${indentStr}  height: ${this.convertDimension(height)},\n`;
    }

    // Add child or children
    if (node.children.length === 1) {
      code += `${indentStr}  child: ${this.generateWidgetTree(node.children[0], indent + 1).trim()},\n`;
    } else if (node.children.length > 1) {
      code += `${indentStr}  child: Column(\n`;
      code += `${indentStr}    children: [\n`;
      for (const child of node.children) {
        code += `${this.generateWidgetTree(child, indent + 3)},\n`;
      }
      code += `${indentStr}    ],\n`;
      code += `${indentStr}  ),\n`;
    }

    return code;
  }

  /**
   * Convert React style object to Flutter BoxDecoration
   * @param {object} props - Node props containing style
   * @param {number} indent - Indentation level
   * @returns {string} BoxDecoration code
   */
  convertStyleToBoxDecoration(props, indent) {
    const indentStr = '  '.repeat(indent);
    const style = props.style || {};
    let code = `BoxDecoration(\n`;

    // Background color
    const bgColor = props.backgroundColor || style.backgroundColor;
    if (bgColor) {
      code += `${indentStr}  color: ${this.convertColor(bgColor)},\n`;
    }

    // Border radius
    if (style.borderRadius) {
      code += `${indentStr}  borderRadius: ${this.convertBorderRadius(style.borderRadius)},\n`;
    }

    // Border
    if (style.border || style.borderWidth || style.borderColor) {
      code += `${indentStr}  border: ${this.convertBorder(style)},\n`;
    }

    // Box shadow
    if (style.boxShadow) {
      code += `${indentStr}  boxShadow: ${this.convertBoxShadow(style.boxShadow)},\n`;
    }

    code += `${indentStr})`;
    return code;
  }

  /**
   * Convert border radius to Flutter BorderRadius
   * @param {string|number} borderRadius - Border radius value
   * @returns {string} BorderRadius code
   */
  convertBorderRadius(borderRadius) {
    if (typeof borderRadius === 'number') {
      return `BorderRadius.circular(${borderRadius})`;
    }
    
    // Handle string values like "10px"
    const numValue = parseFloat(borderRadius);
    if (!isNaN(numValue)) {
      return `BorderRadius.circular(${numValue})`;
    }
    
    return `BorderRadius.circular(0)`;
  }

  /**
   * Convert border to Flutter Border
   * @param {object} style - Style object with border properties
   * @returns {string} Border code
   */
  convertBorder(style) {
    const borderWidth = parseFloat(style.borderWidth || style.border || 1);
    const borderColor = this.convertColor(style.borderColor || '#000000');
    
    return `Border.all(width: ${borderWidth}, color: ${borderColor})`;
  }

  /**
   * Convert box shadow to Flutter BoxShadow
   * @param {string} boxShadow - Box shadow CSS value
   * @returns {string} BoxShadow list code
   */
  convertBoxShadow(boxShadow) {
    // Simple implementation - parse basic box-shadow
    // Format: "0px 2px 4px rgba(0,0,0,0.1)"
    return `[\n      BoxShadow(\n        color: Colors.black26,\n        blurRadius: 4,\n        offset: Offset(0, 2),\n      ),\n    ]`;
  }

  /**
   * Convert padding to EdgeInsets
   * @param {string|number|object} padding - Padding value
   * @returns {string|null} EdgeInsets code
   */
  convertPaddingToEdgeInsets(padding) {
    if (!padding) return null;

    // Handle numeric padding
    if (typeof padding === 'number') {
      return `EdgeInsets.all(${padding})`;
    }

    // Handle string padding like "10px"
    if (typeof padding === 'string') {
      const numValue = parseFloat(padding);
      if (!isNaN(numValue)) {
        return `EdgeInsets.all(${numValue})`;
      }
    }

    // Handle object padding like { top: 10, left: 5, right: 5, bottom: 10 }
    if (typeof padding === 'object') {
      const top = parseFloat(padding.top || padding.paddingTop || 0);
      const right = parseFloat(padding.right || padding.paddingRight || 0);
      const bottom = parseFloat(padding.bottom || padding.paddingBottom || 0);
      const left = parseFloat(padding.left || padding.paddingLeft || 0);

      // Check if all sides are equal
      if (top === right && right === bottom && bottom === left) {
        return `EdgeInsets.all(${top})`;
      }

      // Check if vertical and horizontal are equal
      if (top === bottom && left === right) {
        return `EdgeInsets.symmetric(vertical: ${top}, horizontal: ${left})`;
      }

      // Use only for different values
      return `EdgeInsets.only(top: ${top}, right: ${right}, bottom: ${bottom}, left: ${left})`;
    }

    return null;
  }

  /**
   * Convert margin to EdgeInsets
   * @param {string|number|object} margin - Margin value
   * @returns {string|null} EdgeInsets code
   */
  convertMarginToEdgeInsets(margin) {
    if (!margin) return null;

    // Handle numeric margin
    if (typeof margin === 'number') {
      return `EdgeInsets.all(${margin})`;
    }

    // Handle string margin like "10px"
    if (typeof margin === 'string') {
      const numValue = parseFloat(margin);
      if (!isNaN(numValue)) {
        return `EdgeInsets.all(${numValue})`;
      }
    }

    // Handle object margin like { top: 10, left: 5, right: 5, bottom: 10 }
    if (typeof margin === 'object') {
      const top = parseFloat(margin.top || margin.marginTop || 0);
      const right = parseFloat(margin.right || margin.marginRight || 0);
      const bottom = parseFloat(margin.bottom || margin.marginBottom || 0);
      const left = parseFloat(margin.left || margin.marginLeft || 0);

      // Check if all sides are equal
      if (top === right && right === bottom && bottom === left) {
        return `EdgeInsets.all(${top})`;
      }

      // Check if vertical and horizontal are equal
      if (top === bottom && left === right) {
        return `EdgeInsets.symmetric(vertical: ${top}, horizontal: ${left})`;
      }

      // Use only for different values
      return `EdgeInsets.only(top: ${top}, right: ${right}, bottom: ${bottom}, left: ${left})`;
    }

    return null;
  }

  /**
   * Convert dimension value (handles px, %, etc.)
   * @param {string|number} dimension - Dimension value
   * @returns {number} Numeric dimension
   */
  convertDimension(dimension) {
    if (typeof dimension === 'number') {
      return dimension;
    }

    // Remove 'px' suffix and parse
    if (typeof dimension === 'string') {
      const numValue = parseFloat(dimension);
      if (!isNaN(numValue)) {
        return numValue;
      }
    }

    return 0;
  }

  /**
   * Generate Text widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateText(node, indent) {
    const indentStr = '  '.repeat(indent);
    let text = node.props.text || '';

    // Replace template placeholders with state variables
    text = this.replaceTemplatePlaceholders(text);

    let code = `${indentStr}Text(\n`;
    code += `${indentStr}  ${this.formatDartString(text)},\n`;

    // Add style if present - convert React text styles to Flutter TextStyle
    if (node.props.style) {
      code += `${indentStr}  style: ${this.convertTextStyleToFlutter(node.props.style, indent + 1)},\n`;
    }

    // Add text alignment if present
    if (node.props.textAlign || (node.props.style && node.props.style.textAlign)) {
      const textAlign = node.props.textAlign || node.props.style.textAlign;
      code += `${indentStr}  textAlign: ${this.convertTextAlign(textAlign)},\n`;
    }

    code += `${indentStr})`;
    return code;
  }

  /**
   * Convert React text style to Flutter TextStyle
   * @param {object} style - React style object
   * @param {number} indent - Indentation level
   * @returns {string} TextStyle code
   */
  convertTextStyleToFlutter(style, indent) {
    const indentStr = '  '.repeat(indent);
    let code = `TextStyle(\n`;

    // Font size
    if (style.fontSize) {
      const fontSize = this.convertDimension(style.fontSize);
      code += `${indentStr}  fontSize: ${fontSize},\n`;
    }

    // Font weight
    if (style.fontWeight) {
      const fontWeight = this.convertFontWeight(style.fontWeight);
      code += `${indentStr}  fontWeight: ${fontWeight},\n`;
    }

    // Font family
    if (style.fontFamily) {
      code += `${indentStr}  fontFamily: '${style.fontFamily}',\n`;
    }

    // Font style (italic)
    if (style.fontStyle === 'italic') {
      code += `${indentStr}  fontStyle: FontStyle.italic,\n`;
    }

    // Color
    if (style.color) {
      const color = this.convertColor(style.color);
      code += `${indentStr}  color: ${color},\n`;
    }

    // Letter spacing
    if (style.letterSpacing) {
      const letterSpacing = this.convertDimension(style.letterSpacing);
      code += `${indentStr}  letterSpacing: ${letterSpacing},\n`;
    }

    // Line height
    if (style.lineHeight) {
      const lineHeight = this.convertDimension(style.lineHeight);
      code += `${indentStr}  height: ${lineHeight},\n`;
    }

    // Text decoration (underline, line-through)
    if (style.textDecoration || style.textDecorationLine) {
      const decoration = this.convertTextDecoration(style.textDecoration || style.textDecorationLine);
      code += `${indentStr}  decoration: ${decoration},\n`;
    }

    code += `${indentStr})`;
    return code;
  }

  /**
   * Convert text alignment to Flutter TextAlign
   * @param {string} textAlign - Text alignment value
   * @returns {string} TextAlign code
   */
  convertTextAlign(textAlign) {
    const alignMap = {
      'left': 'TextAlign.left',
      'right': 'TextAlign.right',
      'center': 'TextAlign.center',
      'justify': 'TextAlign.justify',
      'start': 'TextAlign.start',
      'end': 'TextAlign.end'
    };
    return alignMap[textAlign] || 'TextAlign.left';
  }

  /**
   * Convert text decoration to Flutter TextDecoration
   * @param {string} decoration - Text decoration value
   * @returns {string} TextDecoration code
   */
  convertTextDecoration(decoration) {
    if (decoration.includes('underline')) {
      return 'TextDecoration.underline';
    }
    if (decoration.includes('line-through')) {
      return 'TextDecoration.lineThrough';
    }
    if (decoration.includes('overline')) {
      return 'TextDecoration.overline';
    }
    return 'TextDecoration.none';
  }

  /**
   * Generate Button widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateButton(node, indent) {
    const indentStr = '  '.repeat(indent);
    const title = node.props.title || 'Button';

    // Find event handler and convert React event names to Flutter
    let onPressedHandler = '() {}';
    if (node.events) {
      const pressEvent = node.events.find(e => 
        e.name === 'onPress' || 
        e.name === 'onClick' || 
        e.name === 'onTap' ||
        e.name === 'onPressed'
      );
      if (pressEvent) {
        const convertedHandler = this.convertReactEventToFlutter(pressEvent);
        onPressedHandler = convertedHandler;
      }
    }

    let code = `${indentStr}ElevatedButton(\n`;
    code += `${indentStr}  onPressed: ${onPressedHandler},\n`;
    code += `${indentStr}  child: Text(${this.formatDartString(title)}),\n`;
    code += `${indentStr})`;
    return code;
  }

  /**
   * Convert React event handler to Flutter event handler
   * Maps React event names (onPress, onClick) to Flutter names (onTap, onPressed)
   * Converts event parameters, async handlers, and ensures state variables are accessible
   * Also converts navigation calls (navigate, history.push) to Flutter Navigator calls
   * @param {object} event - Event definition from IR
   * @returns {string} Flutter event handler code
   */
  convertReactEventToFlutter(event) {
    let handler = event.handler;
    
    // Extract handler name if it's a simple identifier
    if (/^[a-zA-Z_]\w*$/.test(handler)) {
      return handler;
    }
    
    // Handle inline arrow functions
    if (handler.includes('=>')) {
      // Convert async arrow functions
      if (handler.includes('async')) {
        // Extract the async function body
        const asyncMatch = handler.match(/async\s*\([^)]*\)\s*=>\s*\{?([^}]*)\}?/);
        if (asyncMatch) {
          const body = asyncMatch[1].trim();
          // Convert to Flutter async function with state access
          const convertedBody = this.convertReactCodeToFlutter(body);
          const bodyWithStateAccess = this.ensureStateAccessInFlutter(convertedBody);
          return `() async {\n      ${bodyWithStateAccess}\n    }`;
        }
        // Simple async arrow function
        return handler.replace(/async\s*\([^)]*\)\s*=>/, '() async =>');
      }
      
      // Convert regular arrow functions
      // Extract parameters and body
      const arrowMatch = handler.match(/\(([^)]*)\)\s*=>\s*\{?([^}]*)\}?/);
      if (arrowMatch) {
        const params = arrowMatch[1].trim();
        const body = arrowMatch[2].trim();
        
        // Convert event parameters (e.g., 'e' or 'event') to Flutter equivalent
        if (params) {
          // In Flutter, most event handlers don't need parameters or use specific types
          // For now, we'll omit the parameter if it's a generic event object
          if (params === 'e' || params === 'event') {
            const convertedBody = this.convertReactCodeToFlutter(body);
            const bodyWithStateAccess = this.ensureStateAccessInFlutter(convertedBody);
            return `() {\n      ${bodyWithStateAccess}\n    }`;
          }
        }
        
        const convertedBody = this.convertReactCodeToFlutter(body);
        const bodyWithStateAccess = this.ensureStateAccessInFlutter(convertedBody);
        return `() {\n      ${bodyWithStateAccess}\n    }`;
      }
    }
    
    // Handle function expressions
    if (handler.includes('function')) {
      return '() { /* TODO: Convert function expression */ }';
    }
    
    // Default: return as-is
    return handler;
  }

  /**
   * Ensure state variables are accessible in Flutter code
   * In Flutter StatefulWidget, state variables are accessed directly (no 'this.' needed in State class)
   * @param {string} code - Flutter code
   * @returns {string} Code with proper state access
   */
  ensureStateAccessInFlutter(code) {
    let result = code;
    
    // State variables in Flutter StatefulWidget are accessed directly
    // No need for 'this.' prefix in the State class
    // But we need to ensure setState is used for state mutations
    
    // Check if code contains state variable assignments
    for (const stateVar of this.stateVariables) {
      // Pattern: variable = value (not inside setState)
      const assignmentRegex = new RegExp(`(?<!setState\\s*\\(\\s*\\(\\s*\\)\\s*\\{[^}]*)\\b${stateVar.name}\\s*=`, 'g');
      
      // If we find direct assignments, they should already be wrapped in setState
      // from convertReactSettersToFlutterSetState
      // Just ensure the variable name is correct
    }
    
    return result;
  }

  /**
   * Convert React code snippets to Flutter/Dart code
   * Handles state setters, console.log, async/await, Promise/Future, navigation calls, etc.
   * @param {string} reactCode - React code snippet
   * @returns {string} Flutter/Dart code
   */
  convertReactCodeToFlutter(reactCode) {
    let flutterCode = reactCode;
    
    // Convert console.log to print
    flutterCode = flutterCode.replace(/console\.log\(/g, 'print(');
    
    // Convert React state setters to Flutter setState
    flutterCode = this.convertReactSettersToFlutterSetState(flutterCode);
    
    // Convert navigation calls
    flutterCode = this.convertNavigationCalls(flutterCode);
    
    // Convert Promise to Future
    flutterCode = flutterCode.replace(/Promise\./g, 'Future.');
    flutterCode = flutterCode.replace(/new Promise\(/g, 'Future(() => ');
    flutterCode = flutterCode.replace(/Promise\.resolve\(/g, 'Future.value(');
    flutterCode = flutterCode.replace(/Promise\.reject\(/g, 'Future.error(');
    flutterCode = flutterCode.replace(/Promise\.all\(/g, 'Future.wait(');
    
    // Convert .then and .catch to Dart equivalents
    flutterCode = flutterCode.replace(/\.then\(\s*\(([^)]*)\)\s*=>/g, '.then((value) =>');
    flutterCode = flutterCode.replace(/\.catch\(\s*\(([^)]*)\)\s*=>/g, '.catchError((error) =>');
    flutterCode = flutterCode.replace(/\.finally\(/g, '.whenComplete(');
    
    // Convert fetch to http.get/post (add comment for manual review)
    if (flutterCode.includes('fetch(')) {
      flutterCode = flutterCode.replace(/fetch\(/g, '/* TODO: Use http.get or http.post */ fetch(');
    }
    
    // Convert async/await syntax (already compatible, but ensure proper formatting)
    // await is the same in both languages, no changes needed
    
    // Convert try-catch-finally (same syntax, but add comment if needed)
    // No changes needed as syntax is identical
    
    return flutterCode;
  }

  /**
   * Convert React Router navigation calls to Flutter Navigator calls
   * Handles navigate(), history.push(), history.replace(), history.goBack()
   * Preserves route parameters passed via state
   * @param {string} code - Code with navigation calls
   * @returns {string} Code with Flutter Navigator calls
   */
  convertNavigationCalls(code) {
    let result = code;
    
    // Convert navigate('/path', { state: data }) to Navigator.pushNamed(context, '/path', arguments: data)
    result = result.replace(/navigate\s*\(\s*['"]([^'"]+)['"],\s*\{\s*state:\s*([^}]+)\}\s*\)/g, "Navigator.pushNamed(context, '$1', arguments: $2)");
    
    // Convert navigate('/path', { replace: true, state: data }) to Navigator.pushReplacementNamed with arguments
    result = result.replace(/navigate\s*\(\s*['"]([^'"]+)['"],\s*\{\s*replace:\s*true,\s*state:\s*([^}]+)\}\s*\)/g, "Navigator.pushReplacementNamed(context, '$1', arguments: $2)");
    
    // Convert navigate('/path', { replace: true }) to Navigator.pushReplacementNamed(context, '/path')
    result = result.replace(/navigate\s*\(\s*['"]([^'"]+)['"],\s*\{\s*replace:\s*true\s*\}\s*\)/g, "Navigator.pushReplacementNamed(context, '$1')");
    
    // Convert navigate('/path') to Navigator.pushNamed(context, '/path')
    result = result.replace(/navigate\s*\(\s*['"]([^'"]+)['"]\s*\)/g, "Navigator.pushNamed(context, '$1')");
    
    // Convert history.push('/path', state) to Navigator.pushNamed with arguments
    result = result.replace(/history\.push\s*\(\s*['"]([^'"]+)['"],\s*([^)]+)\)/g, "Navigator.pushNamed(context, '$1', arguments: $2)");
    
    // Convert history.push('/path') to Navigator.pushNamed(context, '/path')
    result = result.replace(/history\.push\s*\(\s*['"]([^'"]+)['"]\s*\)/g, "Navigator.pushNamed(context, '$1')");
    
    // Convert history.replace('/path') to Navigator.pushReplacementNamed(context, '/path')
    result = result.replace(/history\.replace\s*\(\s*['"]([^'"]+)['"]\s*\)/g, "Navigator.pushReplacementNamed(context, '$1')");
    
    // Convert history.goBack() to Navigator.pop(context)
    result = result.replace(/history\.goBack\s*\(\s*\)/g, 'Navigator.pop(context)');
    
    // Convert navigate(-1) to Navigator.pop(context)
    result = result.replace(/navigate\s*\(\s*-1\s*\)/g, 'Navigator.pop(context)');
    
    // Add comment about accessing route parameters
    if (result.includes('location.state') || result.includes('useLocation')) {
      result = result.replace(/location\.state/g, 
        '/* Use ModalRoute.of(context)?.settings.arguments to access route parameters */ ModalRoute.of(context)?.settings.arguments');
    }
    
    return result;
  }

  /**
   * Convert React state setter calls to Flutter setState
   * @param {string} reactCode - React code with state setters
   * @returns {string} Flutter code with setState
   */
  convertReactSettersToFlutterSetState(reactCode) {
    let flutterCode = reactCode;
    
    // Convert each state setter call to setState
    for (const stateVar of this.stateVariables) {
      if (stateVar.setter) {
        // Pattern: setVariable(value) -> setState(() { variable = value; })
        const setterRegex = new RegExp(`${stateVar.setter}\\s*\\(([^)]+)\\)`, 'g');
        flutterCode = flutterCode.replace(setterRegex, (match, value) => {
          return `setState(() {\n      ${stateVar.name} = ${value};\n    })`;
        });
      }
    }
    
    return flutterCode;
  }

  /**
   * Generate ListView widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateListView(node, indent) {
    const indentStr = '  '.repeat(indent);
    let code = `${indentStr}ListView(\n`;
    code += `${indentStr}  children: [\n`;

    for (const child of node.children) {
      code += `${this.generateWidgetTree(child, indent + 2)},\n`;
    }

    code += `${indentStr}  ],\n`;
    code += `${indentStr})`;
    return code;
  }

  /**
   * Generate TextField widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateTextField(node, indent) {
    const indentStr = '  '.repeat(indent);
    let code = `${indentStr}TextField(\n`;

    if (node.props.placeholder) {
      code += `${indentStr}  decoration: InputDecoration(\n`;
      code += `${indentStr}    hintText: ${this.formatDartString(node.props.placeholder)},\n`;
      code += `${indentStr}  ),\n`;
    }

    code += `${indentStr})`;
    return code;
  }

  /**
   * Generate Image widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateImage(node, indent) {
    const indentStr = '  '.repeat(indent);
    const src = node.props.src || '';

    let code = `${indentStr}Image.network(\n`;
    code += `${indentStr}  ${this.formatDartString(src)},\n`;

    if (node.props.width) {
      code += `${indentStr}  width: ${node.props.width},\n`;
    }
    if (node.props.height) {
      code += `${indentStr}  height: ${node.props.height},\n`;
    }

    code += `${indentStr})`;
    return code;
  }

  /**
   * Generate generic widget
   * @param {object} node - IR node
   * @param {number} indent - Indentation level
   * @returns {string} Widget code
   */
  generateGenericWidget(node, indent) {
    const indentStr = '  '.repeat(indent);
    const mapping = this.widgetMappings[node.type];
    const dartWidget = mapping.dart;

    let code = `${indentStr}${dartWidget}(\n`;
    code += `${indentStr}  // TODO: Add props\n`;
    code += `${indentStr})`;
    return code;
  }

  /**
   * Replace template placeholders with Dart string interpolation
   * @param {string} text - Text with placeholders
   * @returns {string} Dart string with interpolation
   */
  replaceTemplatePlaceholders(text) {
    // Replace {{variable}} with $variable
    return text.replace(/\{\{([^}]+)\}\}/g, '$$$1');
  }

  /**
   * Convert color to Dart Color
   * Handles hex (#RRGGBB, #RRGGBBAA, #AARRGGBB), rgb(), rgba(), and named colors
   * @param {string} color - Color value
   * @returns {string} Dart Color code
   */
  convertColor(color) {
    if (!color) return 'Colors.transparent';

    // Handle hex colors
    if (color.startsWith('#')) {
      let hex = color.replace('#', '').toUpperCase();
      
      // Handle 3-digit hex (#RGB -> #RRGGBB)
      if (hex.length === 3) {
        const r = hex[0] + hex[0];
        const g = hex[1] + hex[1];
        const b = hex[2] + hex[2];
        return `Color(0xFF${r}${g}${b})`;
      }
      
      // Handle 6-digit hex (#RRGGBB)
      if (hex.length === 6) {
        return `Color(0xFF${hex})`;
      }
      
      // Handle 8-digit hex - assume #AARRGGBB format (alpha first) which is Flutter's format
      if (hex.length === 8) {
        return `Color(0x${hex})`;
      }
      
      return `Color(0xFF${hex})`;
    }

    // Handle rgb() and rgba()
    if (color.startsWith('rgb')) {
      return this.convertRgbToColor(color);
    }

    // Handle named colors
    const namedColors = {
      'transparent': 'Colors.transparent',
      'black': 'Colors.black',
      'white': 'Colors.white',
      'red': 'Colors.red',
      'green': 'Colors.green',
      'blue': 'Colors.blue',
      'yellow': 'Colors.yellow',
      'orange': 'Colors.orange',
      'purple': 'Colors.purple',
      'pink': 'Colors.pink',
      'grey': 'Colors.grey',
      'gray': 'Colors.grey',
      'brown': 'Colors.brown',
      'cyan': 'Colors.cyan',
      'indigo': 'Colors.indigo',
      'lime': 'Colors.lime',
      'teal': 'Colors.teal',
      'amber': 'Colors.amber'
    };

    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }

    // Default fallback
    return `Colors.${color}`;
  }

  /**
   * Convert font weight to Dart FontWeight
   * @param {string} weight - Font weight
   * @returns {string} Dart FontWeight code
   */
  convertFontWeight(weight) {
    const weightMap = {
      'normal': 'FontWeight.normal',
      'bold': 'FontWeight.bold',
      '100': 'FontWeight.w100',
      '200': 'FontWeight.w200',
      '300': 'FontWeight.w300',
      '400': 'FontWeight.w400',
      '500': 'FontWeight.w500',
      '600': 'FontWeight.w600',
      '700': 'FontWeight.w700',
      '800': 'FontWeight.w800',
      '900': 'FontWeight.w900',
    };
    return weightMap[weight] || 'FontWeight.normal';
  }

  /**
   * Map TypeScript type to Dart type
   * @param {string} type - TypeScript type
   * @returns {string} Dart type
   */
  mapTypeToDart(type) {
    const typeMap = {
      'string': 'String',
      'number': 'double',
      'boolean': 'bool',
      'array': 'List',
      'object': 'Map<String, dynamic>',
      'any': 'dynamic'
    };
    return typeMap[type] || 'dynamic';
  }

  /**
   * Convert rgb/rgba to Dart Color
   * @param {string} rgb - RGB/RGBA color string
   * @returns {string} Dart Color code
   */
  convertRgbToColor(rgb) {
    // Match rgb(r, g, b) or rgba(r, g, b, a)
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    
    if (!match) {
      return 'Colors.black';
    }

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1.0;

    // Convert alpha from 0-1 to 0-255
    const alpha = Math.round(a * 255);

    // Convert to hex
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    const aHex = alpha.toString(16).padStart(2, '0');

    return `Color(0x${aHex}${rHex}${gHex}${bHex})`;
  }

  /**
   * Format Dart value
   * @param {any} value - Value to format
   * @param {string} type - Value type
   * @returns {string} Formatted Dart value
   */
  formatDartValue(value, type) {
    if (value === null) return 'null';
    if (type === 'string') return this.formatDartString(value);
    if (type === 'number') return String(value);
    if (type === 'boolean') return String(value);
    if (type === 'array') return '[]';
    if (type === 'object') return '{}';
    return 'null';
  }

  /**
   * Format string for Dart
   * @param {string} str - String to format
   * @returns {string} Formatted Dart string
   */
  formatDartString(str) {
    // Check if string contains template variables
    if (str.includes('{{') && str.includes('}}')) {
      // Convert to Dart string interpolation
      const interpolated = this.replaceTemplatePlaceholders(str);
      return `'${interpolated}'`;
    }
    
    // Escape single quotes
    const escaped = str.replace(/'/g, "\\'");
    return `'${escaped}'`;
  }

  /**
   * Basic Dart code formatting
   * @param {string} code - Code to format
   * @returns {string} Formatted code
   */
  formatDartCode(code) {
    // This is a basic formatter - in production, use dart_style
    return code;
  }

  /**
   * Convert IR file to Flutter Dart file
   * @param {string} irPath - Path to IR JSON file
   * @param {string} outputPath - Path to output Dart file
   * @param {string} mappingPath - Path to widget mapping JSON file
   * @returns {string} Generated Dart code
   */
  convertFileToFlutter(irPath, outputPath, mappingPath) {
    try {
      // Load IR
      const irContent = fs.readFileSync(irPath, 'utf-8');
      const ir = JSON.parse(irContent);

      // Load mappings
      this.loadMappings(mappingPath);

      // Convert to Flutter
      const dartCode = this.convertToFlutter(ir);

      // Write to output file
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, dartCode, 'utf-8');

      console.log(`✓ Flutter code generated successfully: ${outputPath}`);

      return dartCode;
    } catch (error) {
      console.error(`✗ Error converting IR to Flutter: ${error.message}`);
      throw error;
    }
  }
}

module.exports = IRToFlutter;
