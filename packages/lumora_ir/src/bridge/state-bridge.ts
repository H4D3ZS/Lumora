/**
 * State Management Bridge
 * Converts state management patterns between React and Flutter
 */

import { StateDefinition, StateVariable } from '../types/ir-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';

/**
 * Configuration for state bridge
 */
export interface StateBridgeConfig {
  errorHandler?: ErrorHandler;
  targetAdapter?: 'bloc' | 'riverpod' | 'provider' | 'getx';
  preserveComments?: boolean;
}

/**
 * React hook information for conversion
 */
export interface ReactHookInfo {
  type: 'useState' | 'useContext' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback';
  stateName: string;
  setterName?: string;
  initialValue?: any;
  contextName?: string;
  reducerName?: string;
  actions?: ReducerAction[];
}

/**
 * Reducer action definition
 */
export interface ReducerAction {
  type: string;
  payload?: any;
}

/**
 * Flutter state information for conversion
 */
export interface FlutterStateInfo {
  type: 'StatefulWidget' | 'InheritedWidget' | 'Bloc' | 'Riverpod' | 'Provider';
  className: string;
  stateVariables: FlutterStateVariable[];
  methods?: FlutterStateMethod[];
}

/**
 * Flutter state variable
 */
export interface FlutterStateVariable {
  name: string;
  type: string;
  initialValue?: string;
  isFinal: boolean;
  isLate: boolean;
}

/**
 * Flutter state method
 */
export interface FlutterStateMethod {
  name: string;
  returnType: string;
  parameters: string[];
  body: string;
}

/**
 * State Bridge
 * Converts state management between React and Flutter
 */
export class StateBridge {
  private errorHandler: ErrorHandler;
  private config: StateBridgeConfig;

  constructor(config: StateBridgeConfig = {}) {
    this.config = {
      targetAdapter: 'bloc',
      preserveComments: true,
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
  }

  /**
   * Convert React state to Flutter code
   */
  convertReactToFlutter(state: StateDefinition, componentName: string): string {
    try {
      if (state.type === 'local') {
        return this.convertLocalStateToFlutter(state, componentName);
      } else if (state.type === 'global') {
        return this.convertGlobalStateToFlutter(state, componentName);
      }
      
      return '';
    } catch (error) {
      console.error('Error converting React to Flutter:', error);
      throw error;
    }
  }

  /**
   * Convert local React state to Flutter StatefulWidget
   */
  private convertLocalStateToFlutter(state: StateDefinition, componentName: string): string {
    const stateVars = state.variables
      .map(v => `  ${this.mapTypeToFlutter(v.type)} ${v.name}${this.formatInitialValue(v.initialValue)};`)
      .join('\n');

    const setters = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateSetterMethod(v))
      .join('\n\n');

    return `
class _${componentName}State extends State<${componentName}> {
${stateVars}

${setters}

  @override
  Widget build(BuildContext context) {
    // Widget tree will be inserted here
    return Container();
  }
}`;
  }

  /**
   * Convert global React state to Flutter Bloc
   */
  private convertGlobalStateToFlutter(state: StateDefinition, componentName: string): string {
    const adapter = this.config.targetAdapter || 'bloc';
    
    switch (adapter) {
      case 'bloc':
        return this.generateBlocState(state, componentName);
      case 'riverpod':
        return this.generateRiverpodState(state, componentName);
      case 'provider':
        return this.generateProviderState(state, componentName);
      case 'getx':
        return this.generateGetXState(state, componentName);
      default:
        return this.generateBlocState(state, componentName);
    }
  }

  /**
   * Generate Bloc state management code
   */
  private generateBlocState(state: StateDefinition, componentName: string): string {
    const blocName = `${componentName}Bloc`;
    const eventName = `${componentName}Event`;
    const stateName = `${componentName}State`;

    // Generate state class
    const stateVars = state.variables
      .map(v => `  final ${this.mapTypeToFlutter(v.type)} ${v.name};`)
      .join('\n');

    const stateConstructor = state.variables
      .map(v => `required this.${v.name}`)
      .join(', ');

    const stateClass = `
class ${stateName} extends Equatable {
${stateVars}

  const ${stateName}({
    ${stateConstructor},
  });

  ${stateName} copyWith({
${state.variables.map(v => `    ${this.mapTypeToFlutter(v.type)}? ${v.name},`).join('\n')}
  }) {
    return ${stateName}(
${state.variables.map(v => `      ${v.name}: ${v.name} ?? this.${v.name},`).join('\n')}
    );
  }

  @override
  List<Object?> get props => [${state.variables.map(v => v.name).join(', ')}];
}`;

    // Generate event classes
    const events = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateBlocEvent(v, eventName))
      .join('\n\n');

    // Generate Bloc class
    const eventHandlers = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateBlocEventHandler(v, eventName, stateName))
      .join('\n\n');

    const initialState = `${stateName}(
${state.variables.map(v => `      ${v.name}: ${this.formatInitialValueForFlutter(v.initialValue, v.type)},`).join('\n')}
    )`;

    const blocClass = `
class ${blocName} extends Bloc<${eventName}, ${stateName}> {
  ${blocName}() : super(${initialState}) {
${state.variables.filter(v => v.mutable).map(v => `    on<Update${this.capitalize(v.name)}Event>(_onUpdate${this.capitalize(v.name)});`).join('\n')}
  }

${eventHandlers}
}`;

    return `
// Base event class
abstract class ${eventName} extends Equatable {
  const ${eventName}();

  @override
  List<Object?> get props => [];
}

${events}

${stateClass}

${blocClass}`;
  }

  /**
   * Generate Bloc event class
   */
  private generateBlocEvent(variable: StateVariable, eventName: string): string {
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
   * Generate Bloc event handler
   */
  private generateBlocEventHandler(variable: StateVariable, eventName: string, stateName: string): string {
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
   * Generate Riverpod state management code
   */
  private generateRiverpodState(state: StateDefinition, componentName: string): string {
    const providerName = `${this.uncapitalize(componentName)}Provider`;
    const stateClassName = `${componentName}State`;

    // Generate state class
    const stateVars = state.variables
      .map(v => `  final ${this.mapTypeToFlutter(v.type)} ${v.name};`)
      .join('\n');

    const stateConstructor = state.variables
      .map(v => `required this.${v.name}`)
      .join(', ');

    const stateClass = `
class ${stateClassName} {
${stateVars}

  const ${stateClassName}({
    ${stateConstructor},
  });

  ${stateClassName} copyWith({
${state.variables.map(v => `    ${this.mapTypeToFlutter(v.type)}? ${v.name},`).join('\n')}
  }) {
    return ${stateClassName}(
${state.variables.map(v => `      ${v.name}: ${v.name} ?? this.${v.name},`).join('\n')}
    );
  }
}`;

    // Generate StateNotifier
    const notifierName = `${componentName}Notifier`;
    const initialState = `${stateClassName}(
${state.variables.map(v => `      ${v.name}: ${this.formatInitialValueForFlutter(v.initialValue, v.type)},`).join('\n')}
    )`;

    const methods = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateRiverpodMethod(v, stateClassName))
      .join('\n\n');

    const notifierClass = `
class ${notifierName} extends StateNotifier<${stateClassName}> {
  ${notifierName}() : super(${initialState});

${methods}
}`;

    // Generate provider
    const provider = `
final ${providerName} = StateNotifierProvider<${notifierName}, ${stateClassName}>((ref) {
  return ${notifierName}();
});`;

    return `${stateClass}

${notifierClass}

${provider}`;
  }

  /**
   * Generate Riverpod method
   */
  private generateRiverpodMethod(variable: StateVariable, stateClassName: string): string {
    const methodName = `update${this.capitalize(variable.name)}`;
    const type = this.mapTypeToFlutter(variable.type);

    return `  void ${methodName}(${type} value) {
    state = state.copyWith(${variable.name}: value);
  }`;
  }

  /**
   * Generate Provider state management code
   */
  private generateProviderState(state: StateDefinition, componentName: string): string {
    const providerName = `${componentName}Provider`;

    const stateVars = state.variables
      .map(v => `  ${this.mapTypeToFlutter(v.type)} _${v.name}${this.formatInitialValue(v.initialValue)};`)
      .join('\n');

    const getters = state.variables
      .map(v => `  ${this.mapTypeToFlutter(v.type)} get ${v.name} => _${v.name};`)
      .join('\n\n');

    const setters = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateProviderSetter(v))
      .join('\n\n');

    return `
class ${providerName} extends ChangeNotifier {
${stateVars}

${getters}

${setters}
}`;
  }

  /**
   * Generate Provider setter
   */
  private generateProviderSetter(variable: StateVariable): string {
    const type = this.mapTypeToFlutter(variable.type);

    return `  void set${this.capitalize(variable.name)}(${type} value) {
    _${variable.name} = value;
    notifyListeners();
  }`;
  }

  /**
   * Generate GetX state management code
   */
  private generateGetXState(state: StateDefinition, componentName: string): string {
    const controllerName = `${componentName}Controller`;

    const stateVars = state.variables
      .map(v => {
        const type = this.mapTypeToFlutter(v.type);
        const initialValue = this.formatInitialValueForFlutter(v.initialValue, v.type);
        return v.mutable
          ? `  final ${v.name} = ${initialValue}.obs;`
          : `  final ${type} ${v.name} = ${initialValue};`;
      })
      .join('\n');

    const methods = state.variables
      .filter(v => v.mutable)
      .map(v => this.generateGetXMethod(v))
      .join('\n\n');

    return `
class ${controllerName} extends GetxController {
${stateVars}

${methods}
}`;
  }

  /**
   * Generate GetX method
   */
  private generateGetXMethod(variable: StateVariable): string {
    const methodName = `update${this.capitalize(variable.name)}`;
    const type = this.mapTypeToFlutter(variable.type);

    return `  void ${methodName}(${type} value) {
    ${variable.name}.value = value;
  }`;
  }

  /**
   * Generate setter method for StatefulWidget
   */
  private generateSetterMethod(variable: StateVariable): string {
    const methodName = `set${this.capitalize(variable.name)}`;
    const type = this.mapTypeToFlutter(variable.type);

    return `  void ${methodName}(${type} value) {
    setState(() {
      ${variable.name} = value;
    });
  }`;
  }

  /**
   * Map TypeScript type to Flutter/Dart type
   */
  private mapTypeToFlutter(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'double',
      'boolean': 'bool',
      'any': 'dynamic',
      'void': 'void',
      'null': 'Null',
      'undefined': 'Null',
      'object': 'Map<String, dynamic>',
      'array': 'List<dynamic>',
      'function': 'Function',
      'ref': 'dynamic',
    };

    // Handle array types: string[] -> List<String>
    if (tsType.endsWith('[]')) {
      const elementType = tsType.slice(0, -2);
      return `List<${this.mapTypeToFlutter(elementType)}>`;
    }

    // Handle generic types: Array<string> -> List<String>
    const genericMatch = tsType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
      const [, container, inner] = genericMatch;
      if (container === 'Array') {
        return `List<${this.mapTypeToFlutter(inner)}>`;
      }
      return `${container}<${this.mapTypeToFlutter(inner)}>`;
    }

    return typeMap[tsType] || tsType;
  }

  /**
   * Format initial value for Dart
   */
  private formatInitialValue(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    return ` = ${this.formatInitialValueForFlutter(value, typeof value)}`;
  }

  /**
   * Format initial value for Flutter with type awareness
   */
  private formatInitialValueForFlutter(value: any, type: string): string {
    if (value === undefined || value === null) {
      // Return default values based on type
      if (type === 'string') return "''";
      if (type === 'number') return '0';
      if (type === 'boolean') return 'false';
      if (type.includes('List') || type.includes('array')) return '[]';
      if (type.includes('Map') || type.includes('object')) return '{}';
      return 'null';
    }

    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "\\'")}'`;
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (Array.isArray(value)) {
      const elements = value.map(v => this.formatInitialValueForFlutter(v, typeof v)).join(', ');
      return `[${elements}]`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([k, v]) => `'${k}': ${this.formatInitialValueForFlutter(v, typeof v)}`)
        .join(', ');
      return `{${entries}}`;
    }

    return String(value);
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Uncapitalize first letter
   */
  private uncapitalize(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Convert React useState to Flutter StatefulWidget state
   */
  convertUseStateToFlutter(hookInfo: ReactHookInfo, componentName: string): string {
    const type = this.mapTypeToFlutter(typeof hookInfo.initialValue);
    const initialValue = this.formatInitialValueForFlutter(hookInfo.initialValue, typeof hookInfo.initialValue);

    return `  ${type} ${hookInfo.stateName} = ${initialValue};

  void ${hookInfo.setterName || `set${this.capitalize(hookInfo.stateName)}`}(${type} value) {
    setState(() {
      ${hookInfo.stateName} = value;
    });
  }`;
  }

  /**
   * Convert React useContext to Flutter InheritedWidget
   */
  convertUseContextToInheritedWidget(hookInfo: ReactHookInfo, componentName: string): string {
    const contextName = hookInfo.contextName || 'Context';
    const widgetName = `${contextName}Widget`;

    return `
class ${widgetName} extends InheritedWidget {
  final dynamic value;

  const ${widgetName}({
    Key? key,
    required this.value,
    required Widget child,
  }) : super(key: key, child: child);

  static ${widgetName}? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<${widgetName}>();
  }

  @override
  bool updateShouldNotify(${widgetName} oldWidget) {
    return value != oldWidget.value;
  }
}

// Usage in component:
// final ${hookInfo.stateName} = ${widgetName}.of(context)?.value;`;
  }

  /**
   * Convert React useReducer to Flutter Bloc
   */
  convertUseReducerToBloc(hookInfo: ReactHookInfo, componentName: string): string {
    const blocName = `${componentName}Bloc`;
    const eventName = `${componentName}Event`;
    const stateName = `${componentName}State`;
    const reducerName = hookInfo.reducerName || 'reducer';

    // Generate events from actions
    const events = (hookInfo.actions || [])
      .map(action => this.generateBlocEventFromAction(action, eventName))
      .join('\n\n');

    // Generate state class
    const stateClass = `
class ${stateName} extends Equatable {
  final dynamic value;

  const ${stateName}(this.value);

  @override
  List<Object?> get props => [value];
}`;

    // Generate event handlers
    const eventHandlers = (hookInfo.actions || [])
      .map(action => this.generateBlocEventHandlerFromAction(action, eventName, stateName))
      .join('\n\n');

    const initialValue = this.formatInitialValueForFlutter(hookInfo.initialValue, 'any');

    const blocClass = `
class ${blocName} extends Bloc<${eventName}, ${stateName}> {
  ${blocName}() : super(${stateName}(${initialValue})) {
${(hookInfo.actions || []).map(action => `    on<${this.capitalize(action.type)}Event>(_on${this.capitalize(action.type)});`).join('\n')}
  }

${eventHandlers}
}`;

    return `
// Base event class
abstract class ${eventName} extends Equatable {
  const ${eventName}();

  @override
  List<Object?> get props => [];
}

${events}

${stateClass}

${blocClass}`;
  }

  /**
   * Generate Bloc event from reducer action
   */
  private generateBlocEventFromAction(action: ReducerAction, eventName: string): string {
    const eventClassName = `${this.capitalize(action.type)}Event`;

    if (action.payload !== undefined) {
      return `
class ${eventClassName} extends ${eventName} {
  final dynamic payload;

  const ${eventClassName}(this.payload);

  @override
  List<Object?> get props => [payload];
}`;
    }

    return `
class ${eventClassName} extends ${eventName} {
  const ${eventClassName}();
}`;
  }

  /**
   * Generate Bloc event handler from reducer action
   */
  private generateBlocEventHandlerFromAction(action: ReducerAction, eventName: string, stateName: string): string {
    const eventClassName = `${this.capitalize(action.type)}Event`;
    const methodName = `_on${this.capitalize(action.type)}`;

    return `  void ${methodName}(
    ${eventClassName} event,
    Emitter<${stateName}> emit,
  ) {
    // Implement reducer logic here
    emit(${stateName}(event.payload ?? state.value));
  }`;
  }

  /**
   * Convert Flutter state to React hooks code
   */
  convertFlutterToReact(flutterState: FlutterStateInfo, componentName: string): string {
    try {
      if (flutterState.type === 'StatefulWidget') {
        return this.convertStatefulWidgetToReact(flutterState, componentName);
      } else if (flutterState.type === 'InheritedWidget') {
        return this.convertInheritedWidgetToContext(flutterState, componentName);
      } else if (flutterState.type === 'Bloc') {
        return this.convertBlocToUseReducer(flutterState, componentName);
      } else if (flutterState.type === 'Riverpod') {
        return this.convertRiverpodToReact(flutterState, componentName);
      } else if (flutterState.type === 'Provider') {
        return this.convertProviderToReact(flutterState, componentName);
      }
      
      return '';
    } catch (error) {
      console.error('Error converting Flutter to React:', error);
      throw error;
    }
  }

  /**
   * Convert StatefulWidget to React useState hooks
   */
  private convertStatefulWidgetToReact(flutterState: FlutterStateInfo, componentName: string): string {
    const stateHooks = flutterState.stateVariables
      .map(v => this.generateUseStateHook(v))
      .join('\n  ');

    return `
function ${componentName}() {
  ${stateHooks}

  return (
    // JSX will be inserted here
    <div></div>
  );
}`;
  }

  /**
   * Generate useState hook from Flutter state variable
   */
  private generateUseStateHook(variable: FlutterStateVariable): string {
    const type = this.mapFlutterTypeToTS(variable.type);
    const initialValue = this.formatFlutterValueForReact(variable.initialValue, variable.type);
    const setterName = `set${this.capitalize(variable.name)}`;

    return `const [${variable.name}, ${setterName}] = useState<${type}>(${initialValue});`;
  }

  /**
   * Convert InheritedWidget to React Context
   */
  private convertInheritedWidgetToContext(flutterState: FlutterStateInfo, componentName: string): string {
    const contextName = `${componentName}Context`;
    const providerName = `${componentName}Provider`;

    // Extract value type from state variables
    const valueType = flutterState.stateVariables.length > 0
      ? this.mapFlutterTypeToTS(flutterState.stateVariables[0].type)
      : 'any';

    return `
import { createContext, useContext, ReactNode } from 'react';

interface ${contextName}Value {
${flutterState.stateVariables.map(v => `  ${v.name}: ${this.mapFlutterTypeToTS(v.type)};`).join('\n')}
}

const ${contextName} = createContext<${contextName}Value | undefined>(undefined);

export function ${providerName}({ children }: { children: ReactNode }) {
  const value: ${contextName}Value = {
${flutterState.stateVariables.map(v => `    ${v.name}: ${this.formatFlutterValueForReact(v.initialValue, v.type)},`).join('\n')}
  };

  return (
    <${contextName}.Provider value={value}>
      {children}
    </${contextName}.Provider>
  );
}

export function use${componentName}() {
  const context = useContext(${contextName});
  if (context === undefined) {
    throw new Error('use${componentName} must be used within a ${providerName}');
  }
  return context;
}`;
  }

  /**
   * Convert Bloc to React useReducer
   */
  private convertBlocToUseReducer(flutterState: FlutterStateInfo, componentName: string): string {
    const reducerName = `${this.uncapitalize(componentName)}Reducer`;
    const actionTypeName = `${componentName}Action`;
    const stateName = `${componentName}State`;

    // Generate state interface
    const stateInterface = `
interface ${stateName} {
${flutterState.stateVariables.map(v => `  ${v.name}: ${this.mapFlutterTypeToTS(v.type)};`).join('\n')}
}`;

    // Generate action types
    const actionTypes = flutterState.stateVariables
      .filter(v => !v.isFinal)
      .map(v => `  | { type: 'UPDATE_${v.name.toUpperCase()}'; payload: ${this.mapFlutterTypeToTS(v.type)} }`)
      .join('\n');

    const actionType = `
type ${actionTypeName} =
${actionTypes || '  | { type: "INIT" }'};`;

    // Generate initial state
    const initialState = `
const initial${stateName}: ${stateName} = {
${flutterState.stateVariables.map(v => `  ${v.name}: ${this.formatFlutterValueForReact(v.initialValue, v.type)},`).join('\n')}
};`;

    // Generate reducer function
    const reducerCases = flutterState.stateVariables
      .filter(v => !v.isFinal)
      .map(v => `    case 'UPDATE_${v.name.toUpperCase()}':
      return { ...state, ${v.name}: action.payload };`)
      .join('\n');

    const reducer = `
function ${reducerName}(state: ${stateName}, action: ${actionTypeName}): ${stateName} {
  switch (action.type) {
${reducerCases}
    default:
      return state;
  }
}`;

    // Generate hook usage
    const hookUsage = `
export function use${componentName}() {
  const [state, dispatch] = useReducer(${reducerName}, initial${stateName});

  return {
    state,
${flutterState.stateVariables.filter(v => !v.isFinal).map(v => `    update${this.capitalize(v.name)}: (value: ${this.mapFlutterTypeToTS(v.type)}) => 
      dispatch({ type: 'UPDATE_${v.name.toUpperCase()}', payload: value }),`).join('\n')}
  };
}`;

    return `${stateInterface}

${actionType}

${initialState}

${reducer}

${hookUsage}`;
  }

  /**
   * Convert Riverpod to React hooks
   */
  private convertRiverpodToReact(flutterState: FlutterStateInfo, componentName: string): string {
    const hookName = `use${componentName}`;
    const stateName = `${componentName}State`;

    // Generate state interface
    const stateInterface = `
interface ${stateName} {
${flutterState.stateVariables.map(v => `  ${v.name}: ${this.mapFlutterTypeToTS(v.type)};`).join('\n')}
}`;

    // Generate custom hook with useState
    const stateHooks = flutterState.stateVariables
      .map(v => {
        const initialValue = this.formatFlutterValueForReact(v.initialValue, v.type);
        return `  const [${v.name}, set${this.capitalize(v.name)}] = useState<${this.mapFlutterTypeToTS(v.type)}>(${initialValue});`;
      })
      .join('\n');

    const updateMethods = flutterState.stateVariables
      .filter(v => !v.isFinal)
      .map(v => `    update${this.capitalize(v.name)}: set${this.capitalize(v.name)},`)
      .join('\n');

    return `${stateInterface}

export function ${hookName}() {
${stateHooks}

  return {
    state: {
${flutterState.stateVariables.map(v => `      ${v.name},`).join('\n')}
    },
${updateMethods}
  };
}`;
  }

  /**
   * Convert Provider to React hooks
   */
  private convertProviderToReact(flutterState: FlutterStateInfo, componentName: string): string {
    // Provider is similar to Riverpod for React conversion
    return this.convertRiverpodToReact(flutterState, componentName);
  }

  /**
   * Map Flutter/Dart type to TypeScript type
   */
  private mapFlutterTypeToTS(dartType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'int': 'number',
      'double': 'number',
      'num': 'number',
      'bool': 'boolean',
      'dynamic': 'any',
      'void': 'void',
      'Null': 'null',
      'Object': 'any',
      'Map<String, dynamic>': 'Record<string, any>',
      'Function': '(...args: any[]) => any',
    };

    // Handle nullable types: String? -> string | null
    if (dartType.endsWith('?')) {
      const baseType = dartType.slice(0, -1);
      return `${this.mapFlutterTypeToTS(baseType)} | null`;
    }

    // Handle List types: List<String> -> string[]
    const listMatch = dartType.match(/^List<(.+)>$/);
    if (listMatch) {
      return `${this.mapFlutterTypeToTS(listMatch[1])}[]`;
    }

    // Handle Map types: Map<String, int> -> Record<string, number>
    const mapMatch = dartType.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
      return `Record<${this.mapFlutterTypeToTS(mapMatch[1])}, ${this.mapFlutterTypeToTS(mapMatch[2])}>`;
    }

    // Handle generic types
    const genericMatch = dartType.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
      return `${genericMatch[1]}<${this.mapFlutterTypeToTS(genericMatch[2])}>`;
    }

    return typeMap[dartType] || dartType;
  }

  /**
   * Format Flutter value for React
   */
  private formatFlutterValueForReact(value: string | undefined, type: string): string {
    if (!value) {
      // Return default values based on type
      if (type.includes('String')) return "''";
      if (type.includes('int') || type.includes('double') || type.includes('num')) return '0';
      if (type.includes('bool')) return 'false';
      if (type.includes('List')) return '[]';
      if (type.includes('Map')) return '{}';
      return 'null';
    }

    // Handle Dart-specific syntax
    value = value.trim();

    // Convert Dart string literals to JS
    if (value.startsWith("'") && value.endsWith("'")) {
      return value;
    }

    // Convert Dart boolean literals
    if (value === 'true' || value === 'false') {
      return value;
    }

    // Convert Dart null
    if (value === 'null') {
      return 'null';
    }

    // Convert Dart lists: [1, 2, 3] -> [1, 2, 3]
    if (value.startsWith('[') && value.endsWith(']')) {
      return value;
    }

    // Convert Dart maps: {'key': 'value'} -> { key: 'value' }
    if (value.startsWith('{') && value.endsWith('}')) {
      // Simple conversion - replace single quotes with double quotes for keys
      return value.replace(/'(\w+)':/g, '$1:');
    }

    // Numbers
    if (!isNaN(Number(value))) {
      return value;
    }

    // Default: wrap in quotes if it looks like a string
    return `'${value}'`;
  }

  /**
   * Serialize state for preservation
   */
  serializeState(state: Record<string, any>): string {
    try {
      return JSON.stringify(state, null, 2);
    } catch (error) {
      console.error('Error serializing state:', error);
      return '{}';
    }
  }

  /**
   * Deserialize state from preserved format
   */
  deserializeState(serialized: string): Record<string, any> {
    try {
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Error deserializing state:', error);
      return {};
    }
  }

  /**
   * Preserve state during hot reload
   * Merges old state values into new state structure
   */
  preserveState(oldState: Record<string, any>, newState: Record<string, any>): Record<string, any> {
    const preserved: Record<string, any> = { ...newState };

    // Merge old state values for keys that exist in both
    Object.keys(oldState).forEach(key => {
      if (key in newState) {
        // Preserve the old value if types match
        if (this.typesMatch(oldState[key], newState[key])) {
          preserved[key] = oldState[key];
        }
      }
    });

    return preserved;
  }

  /**
   * Check if two values have matching types
   */
  private typesMatch(value1: any, value2: any): boolean {
    const type1 = this.getValueType(value1);
    const type2 = this.getValueType(value2);
    return type1 === type2;
  }

  /**
   * Get the type of a value
   */
  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Migrate state from old structure to new structure
   * Handles schema changes during development
   */
  migrateState(
    oldState: Record<string, any>,
    oldDefinition: StateDefinition,
    newDefinition: StateDefinition
  ): Record<string, any> {
    const migratedState: Record<string, any> = {};

    // Create a map of old variables by name
    const oldVars = new Map(oldDefinition.variables.map(v => [v.name, v]));

    // Process each new variable
    newDefinition.variables.forEach(newVar => {
      const oldVar = oldVars.get(newVar.name);

      if (oldVar) {
        // Variable exists in both old and new
        if (newVar.name in oldState) {
          // Try to preserve the value
          const oldValue = oldState[newVar.name];
          
          if (this.canConvertType(oldVar.type, newVar.type)) {
            // Types are compatible, preserve value
            migratedState[newVar.name] = this.convertValue(oldValue, oldVar.type, newVar.type);
          } else {
            // Types are incompatible, use new initial value
            migratedState[newVar.name] = newVar.initialValue;
          }
        } else {
          // Value not in old state, use new initial value
          migratedState[newVar.name] = newVar.initialValue;
        }
      } else {
        // New variable, use initial value
        migratedState[newVar.name] = newVar.initialValue;
      }
    });

    return migratedState;
  }

  /**
   * Check if a value can be converted from one type to another
   */
  private canConvertType(fromType: string, toType: string): boolean {
    // Same type is always compatible
    if (fromType === toType) return true;

    // Number types are compatible with each other
    const numberTypes = ['number', 'int', 'double', 'num'];
    if (numberTypes.includes(fromType) && numberTypes.includes(toType)) {
      return true;
    }

    // String is compatible with most types (can be parsed)
    if (fromType === 'string') {
      return ['number', 'boolean', 'int', 'double', 'bool'].includes(toType);
    }

    // Any/dynamic is compatible with everything
    if (fromType === 'any' || fromType === 'dynamic') return true;
    if (toType === 'any' || toType === 'dynamic') return true;

    return false;
  }

  /**
   * Convert a value from one type to another
   */
  private convertValue(value: any, fromType: string, toType: string): any {
    // Same type, no conversion needed
    if (fromType === toType) return value;

    // Convert to number
    if (['number', 'int', 'double', 'num'].includes(toType)) {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    }

    // Convert to boolean
    if (toType === 'boolean' || toType === 'bool') {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    }

    // Convert to string
    if (toType === 'string' || toType === 'String') {
      return String(value);
    }

    // Default: return as-is
    return value;
  }

  /**
   * Generate state preservation code for Flutter
   */
  generateFlutterStatePreservation(componentName: string, stateVars: StateVariable[]): string {
    const className = `_${componentName}State`;

    return `
  // State preservation for hot reload
  @override
  void reassemble() {
    super.reassemble();
    // State is automatically preserved by Flutter during hot reload
  }

  // Save state to persistent storage (optional)
  Future<void> saveState() async {
    final prefs = await SharedPreferences.getInstance();
${stateVars.map(v => `    await prefs.set${this.getPrefsMethod(v.type)}('${v.name}', ${v.name});`).join('\n')}
  }

  // Restore state from persistent storage (optional)
  Future<void> restoreState() async {
    final prefs = await SharedPreferences.getInstance();
${stateVars.map(v => `    ${v.name} = prefs.get${this.getPrefsMethod(v.type)}('${v.name}') ?? ${v.name};`).join('\n')}
    setState(() {});
  }`;
  }

  /**
   * Get SharedPreferences method name for type
   */
  private getPrefsMethod(type: string): string {
    if (type === 'string' || type === 'String') return 'String';
    if (type === 'number' || type === 'int') return 'Int';
    if (type === 'number' || type === 'double') return 'Double';
    if (type === 'boolean' || type === 'bool') return 'Bool';
    return 'String'; // Default to string with JSON encoding
  }

  /**
   * Generate state preservation code for React
   */
  generateReactStatePreservation(componentName: string, stateVars: StateVariable[]): string {
    return `
  // State preservation using localStorage
  useEffect(() => {
    // Load state from localStorage on mount
    const savedState = localStorage.getItem('${componentName}_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
${stateVars.map(v => `        if (parsed.${v.name} !== undefined) set${this.capitalize(v.name)}(parsed.${v.name});`).join('\n')}
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save state to localStorage on change
    const stateToSave = {
${stateVars.map(v => `      ${v.name},`).join('\n')}
    };
    localStorage.setItem('${componentName}_state', JSON.stringify(stateToSave));
  }, [${stateVars.map(v => v.name).join(', ')}]);`;
  }

  /**
   * Create a state snapshot for debugging
   */
  createStateSnapshot(state: Record<string, any>, definition: StateDefinition): StateSnapshot {
    return {
      timestamp: Date.now(),
      state: { ...state },
      definition: {
        type: definition.type,
        variables: definition.variables.map(v => ({ ...v })),
      },
    };
  }

  /**
   * Compare two state snapshots
   */
  compareStateSnapshots(snapshot1: StateSnapshot, snapshot2: StateSnapshot): StateComparison {
    const changes: StateChange[] = [];

    // Check for added variables
    snapshot2.definition.variables.forEach(newVar => {
      const oldVar = snapshot1.definition.variables.find(v => v.name === newVar.name);
      if (!oldVar) {
        changes.push({
          type: 'added',
          variable: newVar.name,
          newValue: snapshot2.state[newVar.name],
        });
      }
    });

    // Check for removed variables
    snapshot1.definition.variables.forEach(oldVar => {
      const newVar = snapshot2.definition.variables.find(v => v.name === oldVar.name);
      if (!newVar) {
        changes.push({
          type: 'removed',
          variable: oldVar.name,
          oldValue: snapshot1.state[oldVar.name],
        });
      }
    });

    // Check for modified variables
    snapshot1.definition.variables.forEach(oldVar => {
      const newVar = snapshot2.definition.variables.find(v => v.name === oldVar.name);
      if (newVar) {
        const oldValue = snapshot1.state[oldVar.name];
        const newValue = snapshot2.state[newVar.name];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            type: 'modified',
            variable: oldVar.name,
            oldValue,
            newValue,
          });
        }

        if (oldVar.type !== newVar.type) {
          changes.push({
            type: 'type_changed',
            variable: oldVar.name,
            oldType: oldVar.type,
            newType: newVar.type,
          });
        }
      }
    });

    return {
      timestamp: Date.now(),
      changes,
      hasChanges: changes.length > 0,
    };
  }
}

/**
 * State snapshot for debugging and comparison
 */
export interface StateSnapshot {
  timestamp: number;
  state: Record<string, any>;
  definition: StateDefinition;
}

/**
 * State change information
 */
export interface StateChange {
  type: 'added' | 'removed' | 'modified' | 'type_changed';
  variable: string;
  oldValue?: any;
  newValue?: any;
  oldType?: string;
  newType?: string;
}

/**
 * State comparison result
 */
export interface StateComparison {
  timestamp: number;
  changes: StateChange[];
  hasChanges: boolean;
}
