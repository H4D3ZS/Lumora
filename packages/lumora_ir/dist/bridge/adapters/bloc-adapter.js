"use strict";
/**
 * Bloc State Adapter
 * Converts state definitions to/from Flutter Bloc pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlocAdapter = void 0;
const base_adapter_1 = require("./base-adapter");
/**
 * Bloc Adapter
 * Generates Bloc, Event, and State classes for Flutter
 */
class BlocAdapter extends base_adapter_1.BaseStateAdapter {
    constructor() {
        super(...arguments);
        this.name = 'bloc';
    }
    /**
     * Convert state definition to Bloc pattern code
     */
    convertToFlutter(state, componentName, config = {}) {
        const blocName = `${componentName}Bloc`;
        const eventName = `${componentName}Event`;
        const stateName = `${componentName}State`;
        // Generate state class
        const stateClass = this.generateStateClass(state, stateName);
        // Generate event classes
        const eventClasses = this.generateEventClasses(state, eventName);
        // Generate Bloc class
        const blocClass = this.generateBlocClass(state, componentName, blocName, eventName, stateName);
        // Generate imports
        const imports = this.generateImports();
        // Generate usage example
        const usage = config.includeImports !== false ? this.generateUsageExample(componentName) : undefined;
        return {
            stateClass,
            eventClasses,
            providerCode: blocClass,
            imports,
            usage,
        };
    }
    /**
     * Generate state class
     */
    generateStateClass(state, stateName) {
        const variables = state.variables;
        const stateVars = this.generateStateVariables(variables, true);
        const constructorParams = this.generateConstructorParams(variables);
        const copyWithParams = this.generateCopyWithParams(variables);
        const copyWithBody = this.generateCopyWithBody(variables, stateName);
        const props = variables.map(v => v.name).join(', ');
        return `
class ${stateName} extends Equatable {
${stateVars}

  const ${stateName}({
    ${constructorParams},
  });

  ${stateName} copyWith({
${copyWithParams}
  }) {
${copyWithBody}
  }

  @override
  List<Object?> get props => [${props}];
}`;
    }
    /**
     * Generate event classes
     */
    generateEventClasses(state, eventName) {
        const baseEvent = `
abstract class ${eventName} extends Equatable {
  const ${eventName}();

  @override
  List<Object?> get props => [];
}`;
        const events = state.variables
            .filter(v => v.mutable)
            .map(v => this.generateEventClass(v, eventName))
            .join('\n');
        return `${baseEvent}\n${events}`;
    }
    /**
     * Generate individual event class
     */
    generateEventClass(variable, eventName) {
        const eventClassName = `Update${this.capitalize(variable.name)}Event`;
        const type = this.mapTypeToFlutter(variable.type);
        return `
class ${eventClassName} extends ${eventName} {
  final ${type} ${variable.name};

  const ${eventClassName}(this.${variable.name});

  @override
  List<Object?> get props => [${variable.name}];
}`;
    }
    /**
     * Generate Bloc class
     */
    generateBlocClass(state, componentName, blocName, eventName, stateName) {
        const initialState = this.generateInitialState(state.variables, stateName);
        const eventRegistrations = state.variables
            .filter(v => v.mutable)
            .map(v => `    on<Update${this.capitalize(v.name)}Event>(_onUpdate${this.capitalize(v.name)});`)
            .join('\n');
        const eventHandlers = state.variables
            .filter(v => v.mutable)
            .map(v => this.generateEventHandler(v, eventName, stateName))
            .join('\n\n');
        return `
class ${blocName} extends Bloc<${eventName}, ${stateName}> {
  ${blocName}() : super(${initialState}) {
${eventRegistrations}
  }

${eventHandlers}
}`;
    }
    /**
     * Generate event handler method
     */
    generateEventHandler(variable, eventName, stateName) {
        const eventClassName = `Update${this.capitalize(variable.name)}Event`;
        const methodName = `_onUpdate${this.capitalize(variable.name)}`;
        return `  void ${methodName}(
    ${eventClassName} event,
    Emitter<${stateName}> emit,
  ) {
    emit(state.copyWith(${variable.name}: event.${variable.name}));
  }`;
    }
    /**
     * Generate imports
     */
    generateImports() {
        return [
            "import 'package:flutter_bloc/flutter_bloc.dart';",
            "import 'package:equatable/equatable.dart';",
        ];
    }
    /**
     * Convert Bloc code back to state definition
     */
    convertFromFlutter(dartCode, componentName) {
        // Parse Dart code to extract state variables
        const variables = [];
        // Extract state class variables
        const stateClassMatch = dartCode.match(/class\s+\w+State\s+extends\s+Equatable\s*{([^}]+)}/s);
        if (stateClassMatch) {
            const classBody = stateClassMatch[1];
            const varMatches = classBody.matchAll(/final\s+(\w+)\s+(\w+);/g);
            for (const match of varMatches) {
                const [, type, name] = match;
                variables.push({
                    name,
                    type: this.mapFlutterTypeToTS(type),
                    initialValue: this.getDefaultValue(type),
                    mutable: true, // Bloc variables are mutable through events
                });
            }
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
     * Get default value for type
     */
    getDefaultValue(type) {
        if (type === 'String')
            return '';
        if (type === 'int' || type === 'double' || type === 'num')
            return 0;
        if (type === 'bool')
            return false;
        if (type.startsWith('List'))
            return [];
        if (type.startsWith('Map'))
            return {};
        return null;
    }
    /**
     * Generate usage example
     */
    generateUsageExample(componentName) {
        const blocName = `${componentName}Bloc`;
        const eventName = `Update${componentName}Event`;
        return `
// Usage Example:

// 1. Create the Bloc
final ${this.uncapitalize(componentName)}Bloc = ${blocName}();

// 2. Use BlocProvider in your widget tree
BlocProvider(
  create: (context) => ${blocName}(),
  child: YourWidget(),
)

// 3. Access the Bloc in your widgets
// Using BlocBuilder
BlocBuilder<${blocName}, ${componentName}State>(
  builder: (context, state) {
    return Text('Value: \${state.value}');
  },
)

// 4. Dispatch events
context.read<${blocName}>().add(${eventName}(newValue));

// 5. Listen to state changes
BlocListener<${blocName}, ${componentName}State>(
  listener: (context, state) {
    // React to state changes
  },
  child: YourWidget(),
)`;
    }
}
exports.BlocAdapter = BlocAdapter;
