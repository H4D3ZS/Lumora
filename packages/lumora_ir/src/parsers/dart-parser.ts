/**
 * Dart/Flutter Parser
 * Parses Dart widgets and converts them to Lumora IR
 */

import { LumoraIR, LumoraNode, StateDefinition, StateVariable, EventDefinition, Parameter } from '../types/ir-types';
import { createIR, createNode } from '../utils/ir-utils';
import { ErrorHandler, getErrorHandler, ErrorSeverity, ErrorCategory } from '../errors/error-handler';

/**
 * Configuration for Dart parser
 */
export interface DartParserConfig {
  errorHandler?: ErrorHandler;
  strictMode?: boolean;
}

/**
 * Widget information extracted from Dart code
 */
export interface WidgetInfo {
  name: string;
  type: 'StatelessWidget' | 'StatefulWidget';
  properties: PropertyInfo[];
  buildMethod: string;
  stateClass?: StateClassInfo;
  lineNumber: number;
}

/**
 * Property information
 */
export interface PropertyInfo {
  name: string;
  type: string;
  isRequired: boolean;
  isFinal: boolean;
  defaultValue?: string;
}

/**
 * State class information for StatefulWidget
 */
export interface StateClassInfo {
  name: string;
  stateVariables: StateVariableInfo[];
  methods: MethodInfo[];
  setStateCalls: SetStateCall[];
}

/**
 * setState call information
 */
export interface SetStateCall {
  lineNumber: number;
  updatedVariables: string[];
  code: string;
}

/**
 * Bloc information
 */
export interface BlocInfo {
  name: string;
  events: BlocEventInfo[];
  states: BlocStateInfo[];
  eventHandlers: BlocEventHandlerInfo[];
  lineNumber: number;
}

/**
 * Bloc event information
 */
export interface BlocEventInfo {
  name: string;
  properties: PropertyInfo[];
}

/**
 * Bloc state information
 */
export interface BlocStateInfo {
  name: string;
  properties: PropertyInfo[];
  isInitial?: boolean;
}

/**
 * Bloc event handler information
 */
export interface BlocEventHandlerInfo {
  eventName: string;
  stateName: string;
  handler: string;
}

/**
 * Riverpod provider information
 */
export interface RiverpodProviderInfo {
  name: string;
  type: 'Provider' | 'StateProvider' | 'StateNotifierProvider' | 'FutureProvider' | 'StreamProvider';
  valueType: string;
  initialValue?: string;
  notifierClass?: string;
  lineNumber: number;
}

/**
 * StateNotifier class information
 */
export interface StateNotifierInfo {
  name: string;
  stateType: string;
  initialState: string;
  methods: MethodInfo[];
  lineNumber: number;
}

/**
 * State variable information
 */
export interface StateVariableInfo {
  name: string;
  type: string;
  initialValue?: string;
  isFinal: boolean;
  isLate: boolean;
}

/**
 * Method information
 */
export interface MethodInfo {
  name: string;
  returnType: string;
  parameters: ParameterInfo[];
  body: string;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  name: string;
  type: string;
  isRequired: boolean;
  isNamed: boolean;
  defaultValue?: string;
}

/**
 * Custom widget definition
 */
export interface CustomWidgetDefinition {
  name: string;
  type: 'StatelessWidget' | 'StatefulWidget';
  properties: PropertyInfo[];
  buildMethod: string;
  isCustom: boolean;
}

/**
 * Widget registry for custom widgets
 */
export class CustomWidgetRegistry {
  private widgets: Map<string, CustomWidgetDefinition> = new Map();

  register(widget: CustomWidgetDefinition): void {
    this.widgets.set(widget.name, widget);
  }

  get(name: string): CustomWidgetDefinition | undefined {
    return this.widgets.get(name);
  }

  has(name: string): boolean {
    return this.widgets.has(name);
  }

  getAll(): CustomWidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  clear(): void {
    this.widgets.clear();
  }
}

/**
 * Dart AST Parser
 * Converts Dart/Flutter code to Lumora IR
 */
export class DartParser {
  private sourceFile: string = '';
  private sourceCode: string = '';
  private errorHandler: ErrorHandler;
  private config: DartParserConfig;
  private customWidgetRegistry: CustomWidgetRegistry;

  constructor(config: DartParserConfig = {}) {
    this.config = {
      strictMode: false,
      ...config,
    };
    this.errorHandler = config.errorHandler || getErrorHandler();
    this.customWidgetRegistry = new CustomWidgetRegistry();
  }

  /**
   * Get the custom widget registry
   */
  getCustomWidgetRegistry(): CustomWidgetRegistry {
    return this.customWidgetRegistry;
  }

  /**
   * Parse Dart/Flutter source code to Lumora IR
   */
  parse(source: string, filename: string): LumoraIR {
    this.sourceFile = filename;
    this.sourceCode = source;

    try {
      const widgets = this.extractWidgets(source);
      const nodes = widgets.map(w => this.convertWidget(w));

      const ir = createIR(
        {
          sourceFramework: 'flutter',
          sourceFile: filename,
          generatedAt: Date.now(),
        },
        nodes
      );

      // Add custom widget definitions to metadata
      const customWidgets = this.customWidgetRegistry.getAll();
      if (customWidgets.length > 0) {
        ir.metadata.customWidgets = customWidgets.map(w => ({
          name: w.name,
          type: w.type,
          properties: w.properties.map(p => ({
            name: p.name,
            type: this.mapDartTypeToTS(p.type),
            required: p.isRequired,
            defaultValue: p.defaultValue,
          })),
        }));
      }

      return ir;
    } catch (error) {
      this.errorHandler.handleParseError({
        filePath: filename,
        errorMessage: (error as Error).message,
        sourceCode: source,
        framework: 'flutter',
      });
      throw error;
    }
  }

  /**
   * Extract all widget definitions from source code
   */
  private extractWidgets(source: string): WidgetInfo[] {
    const widgets: WidgetInfo[] = [];

    // Find StatelessWidget classes
    const statelessWidgets = this.findStatelessWidgets(source);
    widgets.push(...statelessWidgets);

    // Find StatefulWidget classes
    const statefulWidgets = this.findStatefulWidgets(source);
    widgets.push(...statefulWidgets);

    // Register custom widgets
    this.registerCustomWidgets(widgets);

    return widgets;
  }

  /**
   * Register custom widgets in the registry
   */
  private registerCustomWidgets(widgets: WidgetInfo[]): void {
    const coreWidgets = new Set([
      'Container', 'Text', 'Column', 'Row', 'Stack', 'Scaffold',
      'AppBar', 'Center', 'Padding', 'SizedBox', 'Expanded',
      'ListView', 'GridView', 'Image', 'Icon', 'IconButton',
      'ElevatedButton', 'TextButton', 'OutlinedButton',
      'TextField', 'Checkbox', 'Radio', 'Switch', 'Slider',
      'Card', 'Divider', 'CircularProgressIndicator',
      'LinearProgressIndicator', 'AlertDialog', 'BottomSheet',
    ]);

    widgets.forEach(widget => {
      // Only register if it's not a core Flutter widget
      if (!coreWidgets.has(widget.name)) {
        this.customWidgetRegistry.register({
          name: widget.name,
          type: widget.type,
          properties: widget.properties,
          buildMethod: widget.buildMethod,
          isCustom: true,
        });
      }
    });
  }

  /**
   * Check if a widget is a custom widget
   */
  isCustomWidget(widgetName: string): boolean {
    return this.customWidgetRegistry.has(widgetName);
  }

  /**
   * Extract custom widget builder
   */
  extractCustomWidgetBuilder(widgetName: string): string | null {
    const widget = this.customWidgetRegistry.get(widgetName);
    if (!widget) {
      return null;
    }

    // Generate a builder function for the custom widget
    const propsInterface = this.generatePropsInterface(widget.properties);
    const builderCode = `
// Custom widget: ${widgetName}
interface ${widgetName}Props {
${propsInterface}
}

function build${widgetName}(props: ${widgetName}Props): Widget {
  // Build method implementation
  ${widget.buildMethod}
}
`;

    return builderCode;
  }

  /**
   * Generate TypeScript props interface from widget properties
   */
  private generatePropsInterface(properties: PropertyInfo[]): string {
    return properties
      .map(prop => {
        let tsType = this.mapDartTypeToTS(prop.type);
        const optional = !prop.isRequired ? '?' : '';
        const defaultComment = prop.defaultValue ? ` // default: ${prop.defaultValue}` : '';
        
        // For nullable types, the optional marker is redundant with | null
        // But we keep it for clarity in the interface
        return `  ${prop.name}${optional}: ${tsType};${defaultComment}`;
      })
      .join('\n');
  }

  /**
   * Extract Bloc definitions from source code
   */
  extractBlocs(source: string): BlocInfo[] {
    const blocs: BlocInfo[] = [];

    // Find Bloc classes (extends Bloc<Event, State>)
    const blocPattern = /class\s+(\w+)\s+extends\s+Bloc<(\w+),\s*(\w+)>\s*\{/g;
    
    let match;
    while ((match = blocPattern.exec(source)) !== null) {
      const blocName = match[1];
      const eventType = match[2];
      const stateType = match[3];
      const lineNumber = this.getLineNumber(source, match.index);
      const classStartIndex = match.index + match[0].length;

      try {
        const classBody = this.extractMethodBody(source, classStartIndex);
        
        // Find event and state definitions
        const events = this.findBlocEvents(source, eventType);
        const states = this.findBlocStates(source, stateType);
        const eventHandlers = this.extractBlocEventHandlers(classBody);

        blocs.push({
          name: blocName,
          events,
          states,
          eventHandlers,
          lineNumber,
        });
      } catch (error) {
        this.errorHandler.handleParseError({
          filePath: this.sourceFile,
          line: lineNumber,
          errorMessage: `Failed to parse Bloc ${blocName}: ${error}`,
          sourceCode: this.sourceCode,
          framework: 'flutter',
        });
      }
    }

    return blocs;
  }

  /**
   * Find Bloc event definitions
   */
  private findBlocEvents(source: string, baseEventName: string): BlocEventInfo[] {
    const events: BlocEventInfo[] = [];
    
    // Pattern to match event class definitions that extend the base event
    const eventPattern = new RegExp(
      `class\\s+(\\w+)\\s+extends\\s+${baseEventName}\\s*\\{`,
      'g'
    );
    
    let match;
    while ((match = eventPattern.exec(source)) !== null) {
      const eventName = match[1];
      const classStartIndex = match.index + match[0].length;
      
      try {
        const classBody = this.extractMethodBody(source, classStartIndex);
        const properties = this.extractProperties(classBody);
        
        events.push({
          name: eventName,
          properties,
        });
      } catch (error) {
        // Skip malformed event classes
      }
    }

    return events;
  }

  /**
   * Find Bloc state definitions
   */
  private findBlocStates(source: string, baseStateName: string): BlocStateInfo[] {
    const states: BlocStateInfo[] = [];
    
    // Pattern to match state class definitions that extend the base state
    const statePattern = new RegExp(
      `class\\s+(\\w+)\\s+extends\\s+${baseStateName}\\s*\\{`,
      'g'
    );
    
    let match;
    while ((match = statePattern.exec(source)) !== null) {
      const stateName = match[1];
      const classStartIndex = match.index + match[0].length;
      
      try {
        const classBody = this.extractMethodBody(source, classStartIndex);
        const properties = this.extractProperties(classBody);
        
        // Check if this is the initial state (often named with "Initial" suffix)
        const isInitial = stateName.includes('Initial');
        
        states.push({
          name: stateName,
          properties,
          isInitial,
        });
      } catch (error) {
        // Skip malformed state classes
      }
    }

    return states;
  }

  /**
   * Extract Bloc event handlers (on<Event> methods)
   */
  private extractBlocEventHandlers(classBody: string): BlocEventHandlerInfo[] {
    const handlers: BlocEventHandlerInfo[] = [];
    
    // Pattern to match on<Event> handlers
    const handlerPattern = /on<(\w+)>\s*\(\s*\(([^,]+),\s*([^)]+)\)\s*(?:async)?\s*\{/g;
    
    let match;
    while ((match = handlerPattern.exec(classBody)) !== null) {
      const eventName = match[1];
      const eventParam = match[2].trim();
      const emitParam = match[3].trim();
      
      const handlerStartIndex = match.index + match[0].length;
      const handlerBody = this.extractMethodBody(classBody, handlerStartIndex);
      
      // Extract emitted state from handler
      const emitPattern = /emit\s*\(\s*(\w+)\s*\(/;
      const emitMatch = emitPattern.exec(handlerBody);
      const stateName = emitMatch ? emitMatch[1] : '';
      
      handlers.push({
        eventName,
        stateName,
        handler: handlerBody,
      });
    }

    return handlers;
  }

  /**
   * Extract Riverpod provider definitions from source code
   */
  extractRiverpodProviders(source: string): RiverpodProviderInfo[] {
    const providers: RiverpodProviderInfo[] = [];

    // Extract Provider<Type>
    const providerPattern = /final\s+(\w+)\s+=\s+Provider<([^>]+)>\s*\(/g;
    let match;
    while ((match = providerPattern.exec(source)) !== null) {
      const providerName = match[1];
      const valueType = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      providers.push({
        name: providerName,
        type: 'Provider',
        valueType,
        lineNumber,
      });
    }

    // Extract StateProvider<Type>
    const stateProviderPattern = /final\s+(\w+)\s+=\s+StateProvider<([^>]+)>\s*\(\s*\([^)]*\)\s*=>\s*([^)]+)\)/g;
    while ((match = stateProviderPattern.exec(source)) !== null) {
      const providerName = match[1];
      const valueType = match[2];
      const initialValue = match[3].trim();
      const lineNumber = this.getLineNumber(source, match.index);
      
      providers.push({
        name: providerName,
        type: 'StateProvider',
        valueType,
        initialValue,
        lineNumber,
      });
    }

    // Extract StateNotifierProvider<Notifier, State>
    const stateNotifierPattern = /final\s+(\w+)\s+=\s+StateNotifierProvider<([^,]+),\s*([^>]+)>\s*\(\s*\([^)]*\)\s*=>\s*(\w+)\s*\(/g;
    while ((match = stateNotifierPattern.exec(source)) !== null) {
      const providerName = match[1];
      const notifierClass = match[2].trim();
      const valueType = match[3].trim();
      const initialValue = match[4];
      const lineNumber = this.getLineNumber(source, match.index);
      
      providers.push({
        name: providerName,
        type: 'StateNotifierProvider',
        valueType,
        notifierClass,
        initialValue,
        lineNumber,
      });
    }

    // Extract FutureProvider<Type>
    const futureProviderPattern = /final\s+(\w+)\s+=\s+FutureProvider<([^>]+)>\s*\(/g;
    while ((match = futureProviderPattern.exec(source)) !== null) {
      const providerName = match[1];
      const valueType = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      providers.push({
        name: providerName,
        type: 'FutureProvider',
        valueType,
        lineNumber,
      });
    }

    // Extract StreamProvider<Type>
    const streamProviderPattern = /final\s+(\w+)\s+=\s+StreamProvider<([^>]+)>\s*\(/g;
    while ((match = streamProviderPattern.exec(source)) !== null) {
      const providerName = match[1];
      const valueType = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      
      providers.push({
        name: providerName,
        type: 'StreamProvider',
        valueType,
        lineNumber,
      });
    }

    return providers;
  }

  /**
   * Extract StateNotifier classes
   */
  extractStateNotifiers(source: string): StateNotifierInfo[] {
    const notifiers: StateNotifierInfo[] = [];

    // Pattern to match StateNotifier classes
    const notifierPattern = /class\s+(\w+)\s+extends\s+StateNotifier<([^>]+)>\s*\{/g;
    
    let match;
    while ((match = notifierPattern.exec(source)) !== null) {
      const notifierName = match[1];
      const stateType = match[2];
      const lineNumber = this.getLineNumber(source, match.index);
      const classStartIndex = match.index + match[0].length;

      try {
        const classBody = this.extractMethodBody(source, classStartIndex);
        
        // Find constructor to get initial state
        const constructorPattern = new RegExp(`${notifierName}\\s*\\([^)]*\\)\\s*:\\s*super\\s*\\(([^)]+)\\)`);
        const constructorMatch = constructorPattern.exec(classBody);
        const initialState = constructorMatch ? constructorMatch[1].trim() : '';

        const methods = this.extractMethods(classBody);

        notifiers.push({
          name: notifierName,
          stateType,
          initialState,
          methods,
          lineNumber,
        });
      } catch (error) {
        this.errorHandler.handleParseError({
          filePath: this.sourceFile,
          line: lineNumber,
          errorMessage: `Failed to parse StateNotifier ${notifierName}: ${error}`,
          sourceCode: this.sourceCode,
          framework: 'flutter',
        });
      }
    }

    return notifiers;
  }

  /**
   * Convert Riverpod provider to state definition
   */
  convertRiverpodToState(provider: RiverpodProviderInfo, notifier?: StateNotifierInfo): StateDefinition {
    const variables: StateVariable[] = [];

    if (provider.type === 'StateProvider' || provider.type === 'Provider') {
      // Simple state provider
      variables.push({
        name: provider.name,
        type: this.mapDartTypeToTS(provider.valueType),
        initialValue: provider.initialValue ? this.parseValue(provider.initialValue) : undefined,
        mutable: provider.type === 'StateProvider',
      });
    } else if (provider.type === 'StateNotifierProvider' && notifier) {
      // StateNotifier - extract state from notifier class
      variables.push({
        name: provider.name,
        type: this.mapDartTypeToTS(notifier.stateType),
        initialValue: notifier.initialState ? this.parseValue(notifier.initialState) : undefined,
        mutable: true,
      });
    } else if (provider.type === 'FutureProvider' || provider.type === 'StreamProvider') {
      // Async providers
      variables.push({
        name: provider.name,
        type: this.mapDartTypeToTS(provider.valueType),
        initialValue: undefined,
        mutable: false,
      });
    }

    return {
      type: 'global', // Riverpod providers are global
      variables,
    };
  }

  /**
   * Find StatelessWidget classes in source code
   */
  private findStatelessWidgets(source: string): WidgetInfo[] {
    const widgets: WidgetInfo[] = [];
    
    // Pattern to match StatelessWidget class declarations (just the start)
    const classPattern = /class\s+(\w+)\s+extends\s+StatelessWidget\s*\{/g;
    
    let match;
    while ((match = classPattern.exec(source)) !== null) {
      const className = match[1];
      const lineNumber = this.getLineNumber(source, match.index);
      const classStartIndex = match.index + match[0].length;

      try {
        // Extract full class body by matching braces
        const classBody = this.extractMethodBody(source, classStartIndex);
        
        const properties = this.extractProperties(classBody);
        const buildMethod = this.extractBuildMethod(classBody);

        widgets.push({
          name: className,
          type: 'StatelessWidget',
          properties,
          buildMethod,
          lineNumber,
        });
      } catch (error) {
        this.errorHandler.handleParseError({
          filePath: this.sourceFile,
          line: lineNumber,
          errorMessage: `Failed to parse StatelessWidget ${className}: ${error}`,
          sourceCode: this.sourceCode,
          framework: 'flutter',
        });
      }
    }

    return widgets;
  }

  /**
   * Find StatefulWidget classes in source code
   */
  private findStatefulWidgets(source: string): WidgetInfo[] {
    const widgets: WidgetInfo[] = [];
    
    // Pattern to match StatefulWidget class declarations (just the start)
    const classPattern = /class\s+(\w+)\s+extends\s+StatefulWidget\s*\{/g;
    
    let match;
    while ((match = classPattern.exec(source)) !== null) {
      const className = match[1];
      const lineNumber = this.getLineNumber(source, match.index);
      const classStartIndex = match.index + match[0].length;

      try {
        // Extract full class body by matching braces
        const classBody = this.extractMethodBody(source, classStartIndex);
        
        const properties = this.extractProperties(classBody);
        
        // Find corresponding State class
        const stateClassName = `_${className}State`;
        const stateClass = this.findStateClass(source, stateClassName);

        widgets.push({
          name: className,
          type: 'StatefulWidget',
          properties,
          buildMethod: stateClass?.buildMethod || '',
          stateClass: stateClass ? {
            name: stateClassName,
            stateVariables: stateClass.stateVariables,
            methods: stateClass.methods,
            setStateCalls: stateClass.setStateCalls,
          } : undefined,
          lineNumber,
        });
      } catch (error) {
        this.errorHandler.handleParseError({
          filePath: this.sourceFile,
          line: lineNumber,
          errorMessage: `Failed to parse StatefulWidget ${className}: ${error}`,
          sourceCode: this.sourceCode,
          framework: 'flutter',
        });
      }
    }

    return widgets;
  }

  /**
   * Find State class for StatefulWidget
   */
  private findStateClass(source: string, stateClassName: string): { buildMethod: string; stateVariables: StateVariableInfo[]; methods: MethodInfo[]; setStateCalls: SetStateCall[] } | null {
    // Pattern to match State class (just the start)
    const statePattern = new RegExp(
      `class\\s+${stateClassName}\\s+extends\\s+State<\\w+>\\s*\\{`,
      ''
    );

    const match = statePattern.exec(source);
    if (!match) {
      return null;
    }

    const classStartIndex = match.index + match[0].length;
    const classBody = this.extractMethodBody(source, classStartIndex);
    
    return {
      buildMethod: this.extractBuildMethod(classBody),
      stateVariables: this.extractStateVariables(classBody),
      methods: this.extractMethods(classBody),
      setStateCalls: this.extractSetStateCalls(classBody),
    };
  }

  /**
   * Extract properties from class body
   */
  private extractProperties(classBody: string): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    
    // Pattern to match property declarations including nullable types
    const propPattern = /(?:final\s+)?(\w+(?:<[^>]+>)?(\?)?)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    
    let match;
    while ((match = propPattern.exec(classBody)) !== null) {
      const type = match[1]; // Includes ? if nullable
      const name = match[3];
      const defaultValue = match[4]?.trim();
      const isFinal = classBody.substring(Math.max(0, match.index - 10), match.index).includes('final');
      
      // Skip if it's inside a method
      if (this.isInsideMethod(classBody, match.index)) {
        continue;
      }

      properties.push({
        name,
        type,
        isRequired: false, // Will be determined from constructor
        isFinal,
        defaultValue,
      });
    }

    // Check constructor for required parameters
    this.updateRequiredProperties(classBody, properties);

    return properties;
  }

  /**
   * Update properties with required information from constructor
   */
  private updateRequiredProperties(classBody: string, properties: PropertyInfo[]): void {
    // Pattern to match constructor with both positional and named parameters
    // Handles: MyWidget(this.title, {this.value = 0})
    const constructorPattern = /\w+\s*\(([^)]*)\)/s;
    const match = constructorPattern.exec(classBody);
    
    if (!match) {
      return;
    }

    const allParams = match[1];
    
    // Extract named parameters section (inside {})
    const namedParamsMatch = /\{([^}]+)\}/.exec(allParams);
    const namedParams = namedParamsMatch ? namedParamsMatch[1] : '';
    
    properties.forEach(prop => {
      // Check if required (only in named parameters)
      if (namedParams) {
        const requiredPattern = new RegExp(`required\\s+this\\.${prop.name}\\b`);
        if (requiredPattern.test(namedParams)) {
          prop.isRequired = true;
        }
        
        // Extract default value from named parameters
        // Pattern: this.propName = value
        const defaultPattern = new RegExp(`this\\.${prop.name}\\s*=\\s*([^,}\\n]+)`);
        const defaultMatch = defaultPattern.exec(namedParams);
        if (defaultMatch && !prop.defaultValue) {
          prop.defaultValue = defaultMatch[1].trim();
        }
      }
    });
  }

  /**
   * Extract build method from class body
   */
  private extractBuildMethod(classBody: string): string {
    // Pattern to match build method
    const buildPattern = /@override\s+Widget\s+build\s*\([^)]*\)\s*\{/;
    const match = buildPattern.exec(classBody);
    
    if (!match) {
      return '';
    }

    // Find the matching closing brace
    const startIndex = match.index + match[0].length;
    const methodBody = this.extractMethodBody(classBody, startIndex);
    
    return this.extractReturnStatement(methodBody);
  }

  /**
   * Extract method body by matching braces
   */
  private extractMethodBody(text: string, startIndex: number): string {
    let braceCount = 1;
    let endIndex = startIndex;
    
    while (braceCount > 0 && endIndex < text.length) {
      if (text[endIndex] === '{') braceCount++;
      if (text[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    return text.substring(startIndex, endIndex - 1);
  }

  /**
   * Extract return statement from build method
   */
  private extractReturnStatement(methodBody: string): string {
    const returnPattern = /return\s+([\s\S]+?);/;
    const match = returnPattern.exec(methodBody.trim());
    
    return match ? match[1].trim() : '';
  }

  /**
   * Extract state variables from State class body
   */
  private extractStateVariables(classBody: string): StateVariableInfo[] {
    const variables: StateVariableInfo[] = [];
    
    // Pattern to match state variable declarations
    // Handles: Type name; Type? name; late Type name; final Type name = value;
    const varPattern = /(late\s+)?(final\s+)?(\w+(?:<[^>]+>)?(\?)?)\s+(\w+)\s*(?:=\s*([^;]+))?;/g;
    
    let match;
    while ((match = varPattern.exec(classBody)) !== null) {
      const isLate = !!match[1];
      const isFinal = !!match[2];
      const type = match[3]; // Includes ? if nullable
      const name = match[5];
      const initialValue = match[6]?.trim();
      
      // Skip if it's inside a method
      if (this.isInsideMethod(classBody, match.index)) {
        continue;
      }

      variables.push({
        name,
        type,
        initialValue,
        isFinal,
        isLate,
      });
    }

    return variables;
  }

  /**
   * Extract setState calls from State class body
   */
  private extractSetStateCalls(classBody: string): SetStateCall[] {
    const setStateCalls: SetStateCall[] = [];
    
    // Pattern to match setState calls
    const setStatePattern = /setState\s*\(\s*\(\s*\)\s*\{([^}]+)\}\s*\)/g;
    
    let match;
    while ((match = setStatePattern.exec(classBody)) !== null) {
      const code = match[1].trim();
      const lineNumber = this.getLineNumber(classBody, match.index);
      const updatedVariables = this.extractUpdatedVariables(code);
      
      setStateCalls.push({
        lineNumber,
        updatedVariables,
        code,
      });
    }

    // Also match arrow function syntax: setState(() => variable = value)
    const arrowSetStatePattern = /setState\s*\(\s*\(\s*\)\s*=>\s*([^)]+)\)/g;
    
    while ((match = arrowSetStatePattern.exec(classBody)) !== null) {
      const code = match[1].trim();
      const lineNumber = this.getLineNumber(classBody, match.index);
      const updatedVariables = this.extractUpdatedVariables(code);
      
      setStateCalls.push({
        lineNumber,
        updatedVariables,
        code,
      });
    }

    return setStateCalls;
  }

  /**
   * Extract variable names that are being updated in setState
   */
  private extractUpdatedVariables(code: string): string[] {
    const variables: string[] = [];
    
    // Pattern to match variable assignments: variableName = value
    const assignmentPattern = /(\w+)\s*=\s*/g;
    
    let match;
    while ((match = assignmentPattern.exec(code)) !== null) {
      const varName = match[1];
      // Exclude 'this' and other keywords
      if (varName !== 'this' && !['var', 'final', 'const'].includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * Extract methods from class body
   */
  private extractMethods(classBody: string): MethodInfo[] {
    const methods: MethodInfo[] = [];
    
    // Pattern to match method declarations (simplified)
    const methodPattern = /(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
    
    let match;
    while ((match = methodPattern.exec(classBody)) !== null) {
      const returnType = match[1];
      const name = match[2];
      const params = match[3];
      
      // Skip build method as it's handled separately
      if (name === 'build') {
        continue;
      }

      methods.push({
        name,
        returnType,
        parameters: this.parseParameters(params),
        body: '', // Body extraction would require more complex parsing
      });
    }

    return methods;
  }

  /**
   * Parse method parameters
   */
  private parseParameters(paramsString: string): ParameterInfo[] {
    if (!paramsString.trim()) {
      return [];
    }

    const parameters: ParameterInfo[] = [];
    
    // Check if there are named parameters (enclosed in {})
    const namedParamsMatch = /\{([^}]+)\}/.exec(paramsString);
    const positionalParamsStr = namedParamsMatch 
      ? paramsString.substring(0, namedParamsMatch.index).trim()
      : paramsString;
    
    // Parse positional parameters
    if (positionalParamsStr) {
      const positionalParams = this.splitAtDepth(positionalParamsStr, ',');
      for (const param of positionalParams) {
        const paramInfo = this.parseParameter(param.trim(), false);
        if (paramInfo) {
          parameters.push(paramInfo);
        }
      }
    }
    
    // Parse named parameters
    if (namedParamsMatch) {
      const namedParamsStr = namedParamsMatch[1];
      const namedParams = this.splitAtDepth(namedParamsStr, ',');
      
      for (const param of namedParams) {
        const paramInfo = this.parseParameter(param.trim(), true);
        if (paramInfo) {
          parameters.push(paramInfo);
        }
      }
    }

    return parameters;
  }

  /**
   * Parse a single parameter
   */
  private parseParameter(paramStr: string, isNamed: boolean): ParameterInfo | null {
    paramStr = paramStr.trim();
    
    if (!paramStr) {
      return null;
    }
    
    // Check if required
    const isRequired = paramStr.startsWith('required ');
    if (isRequired) {
      paramStr = paramStr.substring('required '.length).trim();
    }
    
    // Extract default value if present
    let defaultValue: string | undefined;
    const defaultMatch = /=\s*(.+)$/.exec(paramStr);
    if (defaultMatch) {
      defaultValue = defaultMatch[1].trim();
      paramStr = paramStr.substring(0, defaultMatch.index).trim();
    }
    
    // Parse type and name
    // Patterns: "Type name", "Type? name" (nullable), or "this.name" (for constructor parameters)
    let type: string;
    let name: string;
    
    if (paramStr.startsWith('this.')) {
      // Constructor parameter: this.name
      name = paramStr.substring(5);
      type = 'dynamic'; // Type will be inferred from field
    } else {
      // Regular parameter: Type name or Type? name
      const parts = paramStr.split(/\s+/);
      if (parts.length >= 2) {
        type = parts[0]; // Includes ? if nullable
        name = parts[1];
      } else {
        // Fallback for malformed parameters
        return null;
      }
    }
    
    return {
      name,
      type,
      isRequired,
      isNamed,
      defaultValue,
    };
  }

  /**
   * Check if position is inside a method
   */
  private isInsideMethod(text: string, position: number): boolean {
    const beforeText = text.substring(0, position);
    const methodPattern = /\w+\s+\w+\s*\([^)]*\)\s*\{/g;
    
    let lastMethodStart = -1;
    let match;
    
    while ((match = methodPattern.exec(beforeText)) !== null) {
      lastMethodStart = match.index;
    }

    if (lastMethodStart === -1) {
      return false;
    }

    // Count braces to see if we're still inside the method
    const textSinceMethod = text.substring(lastMethodStart, position);
    let braceCount = 0;
    
    for (const char of textSinceMethod) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    return braceCount > 0;
  }

  /**
   * Get line number for a position in source code
   */
  private getLineNumber(source: string, position: number): number {
    return source.substring(0, position).split('\n').length;
  }

  /**
   * Convert widget to Lumora IR node
   */
  private convertWidget(widget: WidgetInfo): LumoraNode {
    const node = createNode(
      widget.name,
      this.convertProperties(widget.properties),
      [],
      widget.lineNumber
    );

    // Add state if StatefulWidget
    if (widget.type === 'StatefulWidget' && widget.stateClass) {
      node.state = this.convertState(widget.stateClass);
    }

    // Parse build method to extract children
    if (widget.buildMethod) {
      node.children = this.parseWidgetTree(widget.buildMethod);
    }

    return node;
  }

  /**
   * Convert properties to props object
   */
  private convertProperties(properties: PropertyInfo[]): Record<string, any> {
    const props: Record<string, any> = {};
    
    properties.forEach(prop => {
      // Include properties with default values (from constructor or field declaration)
      if (prop.defaultValue) {
        props[prop.name] = this.parseValue(prop.defaultValue);
      }
    });

    return props;
  }

  /**
   * Convert parameters to IR props with metadata
   */
  convertParametersToProps(parameters: ParameterInfo[]): {
    props: Record<string, any>;
    metadata: {
      required: string[];
      optional: string[];
      defaults: Record<string, any>;
    };
  } {
    const props: Record<string, any> = {};
    const required: string[] = [];
    const optional: string[] = [];
    const defaults: Record<string, any> = {};
    
    parameters.forEach(param => {
      // Track required vs optional
      if (param.isRequired) {
        required.push(param.name);
      } else {
        optional.push(param.name);
      }
      
      // Store default values
      if (param.defaultValue) {
        const parsedValue = this.parseValue(param.defaultValue);
        defaults[param.name] = parsedValue;
        props[param.name] = parsedValue;
      }
    });
    
    return {
      props,
      metadata: {
        required,
        optional,
        defaults,
      },
    };
  }

  /**
   * Convert state class to state definition
   */
  private convertState(stateClass: StateClassInfo): StateDefinition {
    return {
      type: 'local',
      variables: stateClass.stateVariables.map(v => ({
        name: v.name,
        type: this.mapDartTypeToTS(v.type),
        initialValue: v.initialValue ? this.parseValue(v.initialValue) : undefined,
        mutable: !v.isFinal,
      })),
    };
  }

  /**
   * Convert Bloc to state definition
   */
  convertBlocToState(bloc: BlocInfo): StateDefinition {
    const variables: StateVariable[] = [];
    
    // Extract variables from all state classes
    bloc.states.forEach(state => {
      state.properties.forEach(prop => {
        // Only add if not already present
        if (!variables.find(v => v.name === prop.name)) {
          variables.push({
            name: prop.name,
            type: this.mapDartTypeToTS(prop.type),
            initialValue: prop.defaultValue ? this.parseValue(prop.defaultValue) : undefined,
            mutable: true, // Bloc state is mutable through events
          });
        }
      });
    });

    return {
      type: 'global', // Bloc is typically used for global state
      variables,
    };
  }

  /**
   * Parse widget tree from build method return statement
   */
  private parseWidgetTree(widgetCode: string): LumoraNode[] {
    // This is a simplified parser - a full implementation would need
    // proper AST parsing or a more sophisticated approach
    
    const widgets: LumoraNode[] = [];
    widgetCode = widgetCode.trim();
    
    // Extract widget type
    const widgetMatch = /^(\w+)\s*\(/.exec(widgetCode);
    if (!widgetMatch) {
      // Handle simple widget references without parentheses (e.g., variable names)
      // For now, return empty array
      return widgets;
    }

    const widgetType = widgetMatch[1];
    const props = this.extractWidgetProps(widgetCode);
    const children = this.extractWidgetChildren(widgetCode);

    // Special handling for Text widget - extract text from first parameter
    if (widgetType === 'Text' && !props.text) {
      const parenIndex = widgetCode.indexOf('(');
      if (parenIndex !== -1) {
        const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
        const params = this.parseNamedParameters(paramsSection);
        
        // If no named parameters, first parameter is the text
        if (Object.keys(params).length === 0 || !params.child) {
          // Extract first positional parameter
          const firstParam = paramsSection.split(',')[0].trim();
          if (firstParam && !firstParam.includes(':')) {
            props.text = this.parseValue(firstParam);
          }
        }
      }
    }

    widgets.push(createNode(
      widgetType,
      props,
      children
    ));

    return widgets;
  }

  /**
   * Extract widget properties from widget constructor
   */
  private extractWidgetProps(widgetCode: string): Record<string, any> {
    const props: Record<string, any> = {};
    
    // Find the opening parenthesis
    const parenIndex = widgetCode.indexOf('(');
    if (parenIndex === -1) {
      return props;
    }

    // Extract the parameters section
    const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
    
    // Parse named parameters
    const params = this.parseNamedParameters(paramsSection);
    
    for (const [name, value] of Object.entries(params)) {
      // Skip 'child' and 'children' as they're handled separately
      if (name === 'child' || name === 'children') {
        continue;
      }

      props[name] = this.parseValue(value);
    }

    return props;
  }

  /**
   * Extract content within parentheses
   */
  private extractParenthesesContent(text: string, startIndex: number): string {
    let parenCount = 1;
    let endIndex = startIndex + 1;
    
    while (parenCount > 0 && endIndex < text.length) {
      if (text[endIndex] === '(') parenCount++;
      if (text[endIndex] === ')') parenCount--;
      endIndex++;
    }
    
    return text.substring(startIndex + 1, endIndex - 1);
  }

  /**
   * Parse named parameters from parameter string
   */
  private parseNamedParameters(paramsString: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    let currentParam = '';
    let currentValue = '';
    let inValue = false;
    let depth = 0;
    
    for (let i = 0; i < paramsString.length; i++) {
      const char = paramsString[i];
      
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
      
      if (char === ':' && depth === 0 && !inValue) {
        inValue = true;
        continue;
      }
      
      if (char === ',' && depth === 0) {
        if (currentParam && currentValue) {
          params[currentParam.trim()] = currentValue.trim();
        }
        currentParam = '';
        currentValue = '';
        inValue = false;
        continue;
      }
      
      if (inValue) {
        currentValue += char;
      } else {
        currentParam += char;
      }
    }
    
    // Add last parameter
    if (currentParam && currentValue) {
      params[currentParam.trim()] = currentValue.trim();
    }
    
    return params;
  }

  /**
   * Extract child widgets
   */
  private extractWidgetChildren(widgetCode: string): LumoraNode[] {
    const children: LumoraNode[] = [];
    
    // Find the opening parenthesis
    const parenIndex = widgetCode.indexOf('(');
    if (parenIndex === -1) {
      return children;
    }

    // Extract the parameters section
    const paramsSection = this.extractParenthesesContent(widgetCode, parenIndex);
    const params = this.parseNamedParameters(paramsSection);
    
    // Look for child parameter
    if (params.child) {
      const childWidgets = this.parseWidgetTree(params.child);
      children.push(...childWidgets);
    }
    
    // Look for children parameter
    if (params.children) {
      // Remove brackets
      let childrenStr = params.children.trim();
      if (childrenStr.startsWith('[')) {
        childrenStr = childrenStr.substring(1, childrenStr.length - 1);
      }
      
      // Split by commas at depth 0
      const childrenList = this.splitAtDepth(childrenStr, ',');
      for (const child of childrenList) {
        const childWidgets = this.parseWidgetTree(child.trim());
        children.push(...childWidgets);
      }
    }

    return children;
  }

  /**
   * Split string by delimiter at depth 0
   */
  private splitAtDepth(text: string, delimiter: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      }
      
      if (char === delimiter && depth === 0) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }

  /**
   * Parse Dart value to JavaScript value
   */
  private parseValue(value: string): any {
    value = value.trim();
    
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Null
    if (value === 'null') return null;
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }
    
    // String
    if (/^['"].*['"]$/.test(value)) {
      return value.slice(1, -1);
    }
    
    // Keep as string for complex expressions
    return value;
  }

  /**
   * Map Dart types to TypeScript types
   */
  private mapDartTypeToTS(dartType: string): string {
    const typeMap: Record<string, string> = {
      'int': 'number',
      'double': 'number',
      'num': 'number',
      'String': 'string',
      'bool': 'boolean',
      'List': 'array',
      'Map': 'object',
      'dynamic': 'any',
      'void': 'void',
    };

    // Handle nullable types (Type?)
    const isNullable = dartType.endsWith('?');
    if (isNullable) {
      const baseType = dartType.slice(0, -1);
      const mappedType = this.mapDartTypeToTS(baseType);
      return `${mappedType} | null`;
    }

    // Handle generic types
    const genericMatch = /^(\w+)<(.+)>$/.exec(dartType);
    if (genericMatch) {
      const baseType = genericMatch[1];
      const genericType = genericMatch[2];
      
      if (baseType === 'List') {
        return `${this.mapDartTypeToTS(genericType)}[]`;
      }
      
      if (baseType === 'Map') {
        // Map<K, V> -> Record<K, V>
        const types = genericType.split(',').map(t => t.trim());
        if (types.length === 2) {
          return `Record<${this.mapDartTypeToTS(types[0])}, ${this.mapDartTypeToTS(types[1])}>`;
        }
      }
      
      return typeMap[baseType] || dartType;
    }

    return typeMap[dartType] || dartType;
  }

  /**
   * Convert Dart null-aware operators to TypeScript equivalents
   */
  convertNullAwareOperators(dartCode: string): string {
    let tsCode = dartCode;
    
    // Convert null-aware access (?.) to optional chaining (?.)
    // Already the same in TypeScript, no conversion needed
    
    // Convert null coalescing (??) to TypeScript (??)
    // Already the same in TypeScript, no conversion needed
    
    // Convert null assertion (!) to TypeScript (!)
    // Already the same in TypeScript, no conversion needed
    
    // Convert late keyword - remove it as TypeScript doesn't have equivalent
    tsCode = tsCode.replace(/\blate\s+/g, '');
    
    return tsCode;
  }

  /**
   * Check if a type is nullable
   */
  isNullableType(dartType: string): boolean {
    return dartType.endsWith('?');
  }

  /**
   * Get non-nullable version of a type
   */
  getNonNullableType(dartType: string): string {
    return dartType.endsWith('?') ? dartType.slice(0, -1) : dartType;
  }

  /**
   * Parse value with null safety awareness
   */
  private parseValueWithNullSafety(value: string, type?: string): any {
    value = value.trim();
    
    // Handle null
    if (value === 'null') {
      return null;
    }
    
    // Handle null-aware operators in expressions
    if (value.includes('?.') || value.includes('??') || value.includes('!')) {
      // Keep as expression string for complex null-aware operations
      return this.convertNullAwareOperators(value);
    }
    
    // Use regular parsing for simple values
    return this.parseValue(value);
  }
}
