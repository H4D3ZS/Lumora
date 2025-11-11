/**
 * Riverpod State Adapter
 * Converts state definitions to/from Flutter Riverpod pattern
 */

import { StateDefinition, StateVariable } from '../../types/ir-types';
import { BaseStateAdapter, AdapterConfig, GeneratedCode } from './base-adapter';

/**
 * Riverpod Adapter
 * Generates StateNotifier and Provider code for Flutter Riverpod
 */
export class RiverpodAdapter extends BaseStateAdapter {
  readonly name = 'riverpod';

  /**
   * Convert state definition to Riverpod pattern code
   */
  convertToFlutter(
    state: StateDefinition,
    componentName: string,
    config: AdapterConfig = {}
  ): GeneratedCode {
    const stateClassName = `${componentName}State`;
    const notifierName = `${componentName}Notifier`;
    const providerName = `${this.uncapitalize(componentName)}Provider`;

    // Generate state class
    const stateClass = this.generateStateClass(state, stateClassName);

    // Generate StateNotifier class
    const notifierClass = this.generateNotifierClass(state, componentName, notifierName, stateClassName);

    // Generate provider
    const providerCode = this.generateProvider(notifierName, stateClassName, providerName);

    // Generate imports
    const imports = this.generateImports();

    // Generate usage example
    const usage = config.includeImports !== false ? this.generateUsageExample(componentName) : undefined;

    return {
      stateClass,
      providerCode: `${notifierClass}\n\n${providerCode}`,
      imports,
      usage,
    };
  }

  /**
   * Generate state class
   */
  private generateStateClass(state: StateDefinition, stateClassName: string): string {
    const variables = state.variables;
    const stateVars = this.generateStateVariables(variables, true);
    const constructorParams = this.generateConstructorParams(variables);
    const copyWithParams = this.generateCopyWithParams(variables);
    const copyWithBody = this.generateCopyWithBody(variables, stateClassName);

    return `
class ${stateClassName} {
${stateVars}

  const ${stateClassName}({
    ${constructorParams},
  });

  ${stateClassName} copyWith({
${copyWithParams}
  }) {
${copyWithBody}
  }
}`;
  }

  /**
   * Generate StateNotifier class
   */
  private generateNotifierClass(
    state: StateDefinition,
    componentName: string,
    notifierName: string,
    stateClassName: string
  ): string {
    const initialState = this.generateInitialState(state.variables, stateClassName);
    const methods = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateUpdateMethod(v, stateClassName))
      .join('\n\n');

    return `
class ${notifierName} extends StateNotifier<${stateClassName}> {
  ${notifierName}() : super(${initialState});

${methods}
}`;
  }

  /**
   * Generate update method for StateNotifier
   */
  private generateUpdateMethod(variable: StateVariable, stateClassName: string): string {
    const methodName = `update${this.capitalize(variable.name)}`;
    const type = this.mapTypeToFlutter(variable.type);

    return `  void ${methodName}(${type} value) {
    state = state.copyWith(${variable.name}: value);
  }`;
  }

  /**
   * Generate provider definition
   */
  private generateProvider(notifierName: string, stateClassName: string, providerName: string): string {
    return `
final ${providerName} = StateNotifierProvider<${notifierName}, ${stateClassName}>((ref) {
  return ${notifierName}();
});`;
  }

  /**
   * Generate imports
   */
  private generateImports(): string[] {
    return [
      "import 'package:flutter_riverpod/flutter_riverpod.dart';",
    ];
  }

  /**
   * Convert Riverpod code back to state definition
   */
  convertFromFlutter(dartCode: string, componentName: string): StateDefinition {
    const variables: StateVariable[] = [];

    // Extract state class variables
    const stateClassMatch = dartCode.match(/class\s+\w+State\s*{([^}]+)}/s);
    if (stateClassMatch) {
      const classBody = stateClassMatch[1];
      const varMatches = classBody.matchAll(/final\s+(\w+)\s+(\w+);/g);

      for (const match of varMatches) {
        const [, type, name] = match;
        variables.push({
          name,
          type: this.mapFlutterTypeToTS(type),
          initialValue: this.getDefaultValue(type),
          mutable: true,
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
  private mapFlutterTypeToTS(dartType: string): string {
    const typeMap: Record<string, string> = {
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
  private getDefaultValue(type: string): any {
    if (type === 'String') return '';
    if (type === 'int' || type === 'double' || type === 'num') return 0;
    if (type === 'bool') return false;
    if (type.startsWith('List')) return [];
    if (type.startsWith('Map')) return {};
    return null;
  }

  /**
   * Generate usage example
   */
  generateUsageExample(componentName: string): string {
    const providerName = `${this.uncapitalize(componentName)}Provider`;

    return `
// Usage Example:

// 1. Wrap your app with ProviderScope
void main() {
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}

// 2. Read the state in your widgets
// Using ConsumerWidget
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(${providerName});
    return Text('Value: \${state.value}');
  }
}

// 3. Update the state
// Using Consumer
Consumer(
  builder: (context, ref, child) {
    return ElevatedButton(
      onPressed: () {
        ref.read(${providerName}.notifier).updateValue(newValue);
      },
      child: Text('Update'),
    );
  },
)

// 4. Listen to state changes
ref.listen(${providerName}, (previous, next) {
  // React to state changes
});

// 5. Read state without rebuilding
final state = ref.read(${providerName});`;
  }
}
