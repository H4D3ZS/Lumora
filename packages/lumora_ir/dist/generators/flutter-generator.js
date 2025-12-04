"use strict";
/**
 * Flutter/Dart Code Generator
 * Generates Flutter widgets from Lumora IR
 * Enables React → Flutter conversion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterGenerator = void 0;
exports.createFlutterGenerator = createFlutterGenerator;
exports.generateFlutterCode = generateFlutterCode;
const error_handler_1 = require("../errors/error-handler");
const widget_mapping_registry_1 = require("../registry/widget-mapping-registry");
/**
 * Flutter Code Generator
 * Converts Lumora IR to Flutter/Dart code
 */
class FlutterGenerator {
    constructor(config = {}) {
        this.imports = new Set();
        this.config = {
            widgetType: 'stateless',
            stateManagement: 'setState',
            indent: '  ',
            addComments: true,
            useConst: true,
            ...config,
        };
        this.errorHandler = config.errorHandler || (0, error_handler_1.getErrorHandler)();
        this.registry = (0, widget_mapping_registry_1.getRegistry)();
    }
    /**
     * Generate Flutter widget from Lumora IR
     */
    generate(ir) {
        this.imports.clear();
        // Add Flutter imports
        this.imports.add("import 'package:flutter/material.dart';");
        // Generate widgets
        const widgets = ir.nodes.map(node => this.generateWidget(node));
        // Build final code
        const importsCode = Array.from(this.imports).join('\n');
        const widgetsCode = widgets.join('\n\n');
        return `${importsCode}\n\n${widgetsCode}`;
    }
    /**
     * Generate a single Flutter widget
     */
    generateWidget(node) {
        const hasState = node.state && node.state.variables.length > 0;
        if (hasState || this.config.widgetType === 'stateful') {
            return this.generateStatefulWidget(node);
        }
        else {
            return this.generateStatelessWidget(node);
        }
    }
    /**
     * Generate StatelessWidget
     */
    generateStatelessWidget(node) {
        const { type: name, props } = node;
        let code = '';
        // Add comment
        if (this.config.addComments && node.metadata?.documentation) {
            code += `// ${node.metadata.documentation}\n`;
        }
        // Class declaration
        code += `class ${name} extends StatelessWidget {\n`;
        // Properties
        if (props && Object.keys(props).length > 0) {
            code += this.generateProperties(props);
        }
        // Constructor
        code += this.generateConstructor(name, props);
        // Build method
        code += `${this.config.indent}@override\n`;
        code += `${this.config.indent}Widget build(BuildContext context) {\n`;
        code += `${this.config.indent}${this.config.indent}return ${this.generateWidgetTree(node, 2)};\n`;
        code += `${this.config.indent}}\n`;
        code += '}\n';
        return code;
    }
    /**
     * Generate StatefulWidget
     */
    generateStatefulWidget(node) {
        const { type: name, props, state, events } = node;
        let code = '';
        // Add comment
        if (this.config.addComments && node.metadata?.documentation) {
            code += `// ${node.metadata.documentation}\n`;
        }
        // StatefulWidget class
        code += `class ${name} extends StatefulWidget {\n`;
        // Properties
        if (props && Object.keys(props).length > 0) {
            code += this.generateProperties(props);
        }
        // Constructor
        code += this.generateConstructor(name, props);
        // createState method
        code += `${this.config.indent}@override\n`;
        code += `${this.config.indent}_${name}State createState() => _${name}State();\n`;
        code += '}\n\n';
        // State class
        code += `class _${name}State extends State<${name}> {\n`;
        // State variables
        if (state) {
            code += this.generateStateVariables(state);
        }
        // Lifecycle methods
        if (node.lifecycle && node.lifecycle.length > 0) {
            code += this.generateLifecycleMethods(node.lifecycle);
        }
        // Event handlers
        if (events && events.length > 0) {
            code += this.generateEventHandlers(events);
        }
        // Build method
        code += `${this.config.indent}@override\n`;
        code += `${this.config.indent}Widget build(BuildContext context) {\n`;
        code += `${this.config.indent}${this.config.indent}return ${this.generateWidgetTree(node, 2)};\n`;
        code += `${this.config.indent}}\n`;
        code += '}\n';
        return code;
    }
    /**
     * Generate widget properties
     */
    generateProperties(props) {
        let code = '';
        for (const [key, value] of Object.entries(props)) {
            const type = this.inferDartType(value);
            const nullable = value.optional !== false ? '?' : '';
            code += `${this.config.indent}final ${type}${nullable} ${key};\n`;
        }
        code += '\n';
        return code;
    }
    /**
     * Generate constructor
     */
    generateConstructor(className, props) {
        let code = `${this.config.indent}${this.config.useConst ? 'const ' : ''}${className}({\n`;
        if (props && Object.keys(props).length > 0) {
            code += `${this.config.indent}${this.config.indent}Key? key,\n`;
            for (const [key, value] of Object.entries(props)) {
                const required = value.optional === false ? 'required ' : '';
                code += `${this.config.indent}${this.config.indent}${required}this.${key},\n`;
            }
        }
        else {
            code += `${this.config.indent}${this.config.indent}Key? key,\n`;
        }
        code += `${this.config.indent}}) : super(key: key);\n\n`;
        return code;
    }
    /**
     * Generate state variables
     */
    generateStateVariables(state) {
        let code = '';
        for (const variable of state.variables) {
            const type = this.mapTypeScriptTypeToDart(variable.type || 'dynamic');
            const initialValue = this.serializeValue(variable.initialValue);
            if (variable.mutable) {
                code += `${this.config.indent}${type} ${variable.name} = ${initialValue};\n`;
            }
            else {
                code += `${this.config.indent}late final ${type} ${variable.name};\n`;
            }
        }
        if (code) {
            code += '\n';
        }
        return code;
    }
    /**
     * Generate lifecycle methods
     */
    generateLifecycleMethods(lifecycle) {
        let code = '';
        for (const hook of lifecycle) {
            switch (hook.type) {
                case 'mount':
                    code += `${this.config.indent}@override\n`;
                    code += `${this.config.indent}void initState() {\n`;
                    code += `${this.config.indent}${this.config.indent}super.initState();\n`;
                    code += `${this.config.indent}${this.config.indent}${hook.handler || '// TODO: Implement initState'}\n`;
                    code += `${this.config.indent}}\n\n`;
                    break;
                case 'unmount':
                    code += `${this.config.indent}@override\n`;
                    code += `${this.config.indent}void dispose() {\n`;
                    code += `${this.config.indent}${this.config.indent}${hook.handler || '// TODO: Implement dispose'}\n`;
                    code += `${this.config.indent}${this.config.indent}super.dispose();\n`;
                    code += `${this.config.indent}}\n\n`;
                    break;
                case 'update':
                    code += `${this.config.indent}@override\n`;
                    code += `${this.config.indent}void didUpdateWidget(covariant ${this.config.indent} oldWidget) {\n`;
                    code += `${this.config.indent}${this.config.indent}super.didUpdateWidget(oldWidget);\n`;
                    code += `${this.config.indent}${this.config.indent}${hook.handler || '// TODO: Implement didUpdateWidget'}\n`;
                    code += `${this.config.indent}}\n\n`;
                    break;
            }
        }
        return code;
    }
    /**
     * Generate event handlers
     */
    generateEventHandlers(events) {
        let code = '';
        for (const event of events) {
            const params = event.parameters?.map(p => `${p.type} ${p.name}`).join(', ') || '';
            code += `${this.config.indent}void ${event.name}(${params}) {\n`;
            // If handler modifies state, wrap in setState
            if (this.handlerModifiesState(event.handler)) {
                code += `${this.config.indent}${this.config.indent}setState(() {\n`;
                code += `${this.config.indent}${this.config.indent}${this.config.indent}${event.handler || '// TODO: Implement handler'}\n`;
                code += `${this.config.indent}${this.config.indent}});\n`;
            }
            else {
                code += `${this.config.indent}${this.config.indent}${event.handler || '// TODO: Implement handler'}\n`;
            }
            code += `${this.config.indent}}\n\n`;
        }
        return code;
    }
    /**
     * Check if handler modifies state
     */
    handlerModifiesState(handler) {
        if (!handler)
            return false;
        // Simple heuristic: check if handler contains assignment
        return handler.includes('=') && !handler.includes('==');
    }
    /**
     * Generate widget tree
     */
    generateWidgetTree(node, indentLevel) {
        const indent = this.config.indent.repeat(indentLevel);
        let mapping = this.registry.getMapping(node.type);
        // If no direct mapping, try to find by React component name
        if (!mapping) {
            const widgetName = this.registry.getWidgetNameFromReact(node.type);
            if (widgetName) {
                mapping = this.registry.getMapping(widgetName);
            }
        }
        // Get Flutter widget name
        const flutterWidget = mapping?.flutter.widget || node.type;
        // Add import if specified
        if (mapping?.flutter?.import) {
            this.imports.add(`import '${mapping.flutter.import}';`);
        }
        // Check if self-closing (no children)
        if (!node.children || node.children.length === 0) {
            const props = this.generateWidgetProps(node.props, mapping, indentLevel);
            return `${this.config.useConst ? 'const ' : ''}${flutterWidget}(${props})`;
        }
        // Generate widget with children
        let code = `${flutterWidget}(\n`;
        // Generate props
        const props = this.generateWidgetProps(node.props, mapping, indentLevel + 1);
        if (props) {
            code += props;
        }
        // Generate children
        if (node.children.length === 1) {
            code += `${indent}${this.config.indent}child: ${this.generateWidgetTree(node.children[0], indentLevel + 1)},\n`;
        }
        else if (node.children.length > 1) {
            code += `${indent}${this.config.indent}children: [\n`;
            for (const child of node.children) {
                code += `${indent}${this.config.indent}${this.config.indent}${this.generateWidgetTree(child, indentLevel + 2)},\n`;
            }
            code += `${indent}${this.config.indent}],\n`;
        }
        code += `${indent})`;
        return code;
    }
    /**
     * Generate widget props
     */
    generateWidgetProps(props, mapping, indentLevel = 0) {
        if (!props || Object.keys(props).length === 0) {
            return '';
        }
        const indent = this.config.indent.repeat(indentLevel + 1);
        let code = '';
        for (const [key, value] of Object.entries(props)) {
            // Map prop name if needed
            const flutterProp = mapping?.props?.[key]?.flutter || key;
            code += `${indent}${flutterProp}: ${this.serializeValue(value)},\n`;
        }
        return code;
    }
    /**
     * Infer Dart type from value
     */
    inferDartType(value) {
        if (value === null || value === undefined) {
            return 'dynamic';
        }
        if (typeof value === 'object' && value.type) {
            return this.mapTypeScriptTypeToDart(value.type);
        }
        const type = typeof value;
        switch (type) {
            case 'string':
                return 'String';
            case 'number':
                return Number.isInteger(value) ? 'int' : 'double';
            case 'boolean':
                return 'bool';
            case 'function':
                return 'VoidCallback';
            case 'object':
                if (Array.isArray(value)) {
                    return 'List<dynamic>';
                }
                return 'Map<String, dynamic>';
            default:
                return 'dynamic';
        }
    }
    /**
     * Map TypeScript type to Dart type
     */
    mapTypeScriptTypeToDart(tsType) {
        const typeMap = {
            'string': 'String',
            'number': 'int',
            'boolean': 'bool',
            'any': 'dynamic',
            'void': 'void',
            'null': 'Null',
            'undefined': 'Null',
            'object': 'Map<String, dynamic>',
            'array': 'List<dynamic>',
            'function': 'Function',
            '() => void': 'VoidCallback',
        };
        return typeMap[tsType] || tsType;
    }
    /**
     * Serialize value to Dart code string
     */
    serializeValue(value) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'null';
        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "\\'")}'`;
        }
        if (typeof value === 'number') {
            return String(value);
        }
        if (typeof value === 'boolean') {
            return String(value);
        }
        if (Array.isArray(value)) {
            return `[${value.map(v => this.serializeValue(v)).join(', ')}]`;
        }
        if (typeof value === 'object') {
            // Handle expression objects
            if (value && value.type === 'expression' && typeof value.content === 'string') {
                return value.content;
            }
            // Handle other objects (maps)
            const entries = Object.entries(value).map(([k, v]) => `'${k}': ${this.serializeValue(v)}`);
            return `{ ${entries.join(', ')} }`;
        }
        return 'null';
    }
}
exports.FlutterGenerator = FlutterGenerator;
/**
 * Helper function to create Flutter generator
 */
function createFlutterGenerator(config) {
    return new FlutterGenerator(config);
}
/**
 * Helper function to generate Flutter code from IR
 */
function generateFlutterCode(ir, config) {
    const generator = new FlutterGenerator(config);
    return generator.generate(ir);
}
