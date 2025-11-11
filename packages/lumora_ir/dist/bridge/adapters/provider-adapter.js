"use strict";
/**
 * Provider State Adapter
 * Converts state definitions to/from Flutter Provider pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderAdapter = void 0;
const base_adapter_1 = require("./base-adapter");
/**
 * Provider Adapter
 * Generates ChangeNotifier classes for Flutter Provider
 */
class ProviderAdapter extends base_adapter_1.BaseStateAdapter {
    constructor() {
        super(...arguments);
        this.name = 'provider';
    }
    /**
     * Convert state definition to Provider pattern code
     */
    convertToFlutter(state, componentName, config = {}) {
        const providerName = `${componentName}Provider`;
        // Generate ChangeNotifier class
        const providerCode = this.generateProviderClass(state, providerName);
        // Generate imports
        const imports = this.generateImports();
        // Generate usage example
        const usage = config.includeImports !== false ? this.generateUsageExample(componentName) : undefined;
        return {
            stateClass: providerCode,
            imports,
            usage,
        };
    }
    /**
     * Generate ChangeNotifier provider class
     */
    generateProviderClass(state, providerName) {
        const variables = state.variables;
        // Private state variables
        const privateVars = variables
            .map(v => {
            const type = this.mapTypeToFlutter(v.type);
            const initialValue = this.formatInitialValue(v.initialValue, v.type);
            return `  ${type} _${v.name} = ${initialValue};`;
        })
            .join('\n');
        // Public getters
        const getters = variables
            .map(v => {
            const type = this.mapTypeToFlutter(v.type);
            return `  ${type} get ${v.name} => _${v.name};`;
        })
            .join('\n\n');
        // Setter methods for mutable variables
        const setters = variables
            .filter(v => v.mutable)
            .map(v => this.generateSetter(v))
            .join('\n\n');
        return `
class ${providerName} extends ChangeNotifier {
${privateVars}

${getters}

${setters}
}`;
    }
    /**
     * Generate setter method
     */
    generateSetter(variable) {
        const type = this.mapTypeToFlutter(variable.type);
        const methodName = `set${this.capitalize(variable.name)}`;
        return `  void ${methodName}(${type} value) {
    _${variable.name} = value;
    notifyListeners();
  }`;
    }
    /**
     * Generate imports
     */
    generateImports() {
        return [
            "import 'package:flutter/foundation.dart';",
            "import 'package:provider/provider.dart';",
        ];
    }
    /**
     * Convert Provider code back to state definition
     */
    convertFromFlutter(dartCode, componentName) {
        const variables = [];
        // Extract private variables
        const varMatches = dartCode.matchAll(/(\w+)\s+_(\w+)\s*=\s*([^;]+);/g);
        for (const match of varMatches) {
            const [, type, name, initialValue] = match;
            variables.push({
                name,
                type: this.mapFlutterTypeToTS(type),
                initialValue: this.parseInitialValue(initialValue.trim()),
                mutable: true, // Provider variables are mutable
            });
        }
        return {
            type: 'global',
            variables,
        };
    }
    /**
     * Map Flutter type to TypeScript type
     */
    mapFlutterTypeToTS(dartType) {
        const typeMap = {
            'String': 'string',
            'int': 'number',
            'double': 'number',
            'num': 'number',
            'bool': 'boolean',
            'dynamic': 'any',
        };
        // Handle List types
        const listMatch = dartType.match(/^List<(.+)>$/);
        if (listMatch) {
            return `${this.mapFlutterTypeToTS(listMatch[1])}[]`;
        }
        return typeMap[dartType] || dartType;
    }
    /**
     * Parse initial value from Dart code
     */
    parseInitialValue(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (value === 'null')
            return null;
        if (value.startsWith("'") || value.startsWith('"')) {
            return value.slice(1, -1);
        }
        if (!isNaN(Number(value))) {
            return Number(value);
        }
        if (value.startsWith('['))
            return [];
        if (value.startsWith('{'))
            return {};
        return value;
    }
    /**
     * Generate usage example
     */
    generateUsageExample(componentName) {
        const providerName = `${componentName}Provider`;
        return `
// Usage Example:

// 1. Create the provider
final ${this.uncapitalize(componentName)}Provider = ${providerName}();

// 2. Wrap your widget tree with ChangeNotifierProvider
ChangeNotifierProvider(
  create: (context) => ${providerName}(),
  child: MyApp(),
)

// 3. Access the provider in your widgets
// Using Consumer
Consumer<${providerName}>(
  builder: (context, provider, child) {
    return Text('Value: \${provider.value}');
  },
)

// 4. Update the state
// Using Provider.of
final provider = Provider.of<${providerName}>(context, listen: false);
provider.setValue(newValue);

// 5. Using context extension
context.read<${providerName}>().setValue(newValue);

// 6. Watch for changes
final value = context.watch<${providerName}>().value;

// 7. Multiple providers
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => ${providerName}()),
    // Add more providers
  ],
  child: MyApp(),
)`;
    }
}
exports.ProviderAdapter = ProviderAdapter;
