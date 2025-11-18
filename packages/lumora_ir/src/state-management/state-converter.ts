/**
 * State Management Converter
 * Handles conversion between different state management patterns
 * React (useState, useReducer, Redux, MobX, Context) ↔ Flutter (setState, Bloc, Riverpod, Provider)
 */

import { StateDefinition, LumoraNode } from '../types/ir-types';

export type ReactStatePattern = 'useState' | 'useReducer' | 'redux' | 'mobx' | 'context' | 'recoil';
export type FlutterStatePattern = 'setState' | 'bloc' | 'cubit' | 'riverpod' | 'provider' | 'getx';

export interface StateConversionResult {
  imports: string[];
  stateDeclarations: string[];
  stateInitialization?: string;
  stateUpdaters: string[];
  stateAccessors: string[];
  dependencies?: string[];
}

export interface ReducerDefinition {
  name: string;
  initialState: any;
  actions: ReducerActionDefinition[];
}

export interface ReducerActionDefinition {
  type: string;
  payload?: any;
  handler: string;
}

export interface ReduxDefinition {
  storeName: string;
  slices: ReduxSlice[];
  middleware?: string[];
}

export interface ReduxSlice {
  name: string;
  initialState: any;
  reducers: Record<string, string>;
  actions?: Record<string, string>;
}

export interface MobXDefinition {
  storeName: string;
  observables: Record<string, any>;
  computed?: Record<string, string>;
  actions: Record<string, string>;
}

export interface BlocDefinition {
  name: string;
  events: BlocEvent[];
  states: BlocState[];
  transitions: BlocTransition[];
}

export interface BlocEvent {
  name: string;
  properties?: Record<string, string>;
}

export interface BlocState {
  name: string;
  properties?: Record<string, any>;
}

export interface BlocTransition {
  event: string;
  fromState: string;
  toState: string;
  handler: string;
}

/**
 * State Management Converter
 */
export class StateConverter {
  /**
   * Convert React useState to Flutter setState
   */
  convertUseStateToSetState(state: StateDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: [],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
    };

    for (const variable of state.variables) {
      // Flutter state declaration
      result.stateDeclarations.push(
        `${this.getFlutterType(variable.type)} ${variable.name}${variable.initialValue ? ` = ${variable.initialValue}` : ''};`
      );

      // State updater (setState wrapper)
      const setterName = `set${this.capitalize(variable.name)}`;
      result.stateUpdaters.push(
        `void ${setterName}(${this.getFlutterType(variable.type)} value) {\n  setState(() {\n    ${variable.name} = value;\n  });\n}`
      );

      // Direct accessor (just use variable name)
      result.stateAccessors.push(`// Access: ${variable.name}`);
    }

    return result;
  }

  /**
   * Convert React useReducer to Flutter Bloc/Cubit
   */
  convertUseReducerToBloc(reducer: ReducerDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: [
        "import 'package:flutter_bloc/flutter_bloc.dart';",
      ],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
      dependencies: ['flutter_bloc'],
    };

    const blocName = `${this.capitalize(reducer.name)}Cubit`;

    // Generate Cubit class
    let cubitCode = `class ${blocName} extends Cubit<${this.capitalize(reducer.name)}State> {\n`;
    cubitCode += `  ${blocName}() : super(${this.capitalize(reducer.name)}State(${JSON.stringify(reducer.initialState)}));\n\n`;

    // Generate methods for each action
    for (const action of reducer.actions) {
      const methodName = this.camelCase(action.type);
      const params = action.payload ? `dynamic payload` : '';

      cubitCode += `  void ${methodName}(${params}) {\n`;
      cubitCode += `    ${action.handler}\n`;
      cubitCode += `    emit(state.copyWith(/* updated state */));\n`;
      cubitCode += `  }\n\n`;

      result.stateUpdaters.push(`${methodName}(${params})`);
    }

    cubitCode += `}\n`;

    result.stateDeclarations.push(cubitCode);

    // Generate state class
    const stateClass = this.generateBlocStateClass(reducer.name, reducer.initialState);
    result.stateDeclarations.push(stateClass);

    return result;
  }

  /**
   * Convert Redux to Flutter Bloc
   */
  convertReduxToBloc(redux: ReduxDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: [
        "import 'package:flutter_bloc/flutter_bloc.dart';",
      ],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
      dependencies: ['flutter_bloc'],
    };

    for (const slice of redux.slices) {
      const blocName = `${this.capitalize(slice.name)}Bloc`;

      // Generate events
      let eventsCode = `// Events for ${blocName}\n`;
      eventsCode += `abstract class ${this.capitalize(slice.name)}Event {}\n\n`;

      for (const [actionName, _] of Object.entries(slice.reducers)) {
        const eventName = `${this.capitalize(actionName)}Event`;
        eventsCode += `class ${eventName} extends ${this.capitalize(slice.name)}Event {\n`;
        eventsCode += `  // Add event properties here\n`;
        eventsCode += `}\n\n`;
      }

      result.stateDeclarations.push(eventsCode);

      // Generate states
      const stateClass = this.generateBlocStateClass(slice.name, slice.initialState);
      result.stateDeclarations.push(stateClass);

      // Generate Bloc
      let blocCode = `class ${blocName} extends Bloc<${this.capitalize(slice.name)}Event, ${this.capitalize(slice.name)}State> {\n`;
      blocCode += `  ${blocName}() : super(${this.capitalize(slice.name)}State.initial()) {\n`;

      for (const [actionName, handler] of Object.entries(slice.reducers)) {
        const eventName = `${this.capitalize(actionName)}Event`;
        blocCode += `    on<${eventName}>((event, emit) {\n`;
        blocCode += `      ${handler}\n`;
        blocCode += `    });\n`;
      }

      blocCode += `  }\n}\n`;

      result.stateDeclarations.push(blocCode);
    }

    return result;
  }

  /**
   * Convert MobX to Flutter GetX or Riverpod
   */
  convertMobXToRiverpod(mobx: MobXDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: [
        "import 'package:flutter_riverpod/flutter_riverpod.dart';",
      ],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
      dependencies: ['flutter_riverpod'],
    };

    const controllerName = `${this.capitalize(mobx.storeName)}Controller`;

    // Generate Riverpod StateNotifier
    let controllerCode = `class ${controllerName} extends StateNotifier<${this.capitalize(mobx.storeName)}State> {\n`;
    controllerCode += `  ${controllerName}() : super(${this.capitalize(mobx.storeName)}State());\n\n`;

    // Generate action methods
    for (const [actionName, actionBody] of Object.entries(mobx.actions)) {
      controllerCode += `  void ${actionName}() {\n`;
      controllerCode += `    ${actionBody}\n`;
      controllerCode += `    state = state.copyWith(/* updated values */);\n`;
      controllerCode += `  }\n\n`;
    }

    // Generate computed getters if any
    if (mobx.computed) {
      for (const [computedName, computedBody] of Object.entries(mobx.computed)) {
        controllerCode += `  get ${computedName} {\n`;
        controllerCode += `    ${computedBody}\n`;
        controllerCode += `  }\n\n`;
      }
    }

    controllerCode += `}\n\n`;

    // Generate provider
    controllerCode += `final ${mobx.storeName}Provider = StateNotifierProvider<${controllerName}, ${this.capitalize(mobx.storeName)}State>(\n`;
    controllerCode += `  (ref) => ${controllerName}(),\n`;
    controllerCode += `);\n`;

    result.stateDeclarations.push(controllerCode);

    // Generate state class
    const stateClass = this.generateRiverpodStateClass(mobx.storeName, mobx.observables);
    result.stateDeclarations.push(stateClass);

    return result;
  }

  /**
   * Convert Flutter setState to React useState
   */
  convertSetStateToUseState(state: StateDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: ["import { useState } from 'react';"],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
    };

    for (const variable of state.variables) {
      // React useState hook
      const setterName = `set${this.capitalize(variable.name)}`;
      const initialValue = variable.initialValue || this.getDefaultValue(variable.type);

      result.stateDeclarations.push(
        `const [${variable.name}, ${setterName}] = useState${this.getTypeAnnotation(variable.type)}(${initialValue});`
      );

      result.stateUpdaters.push(setterName);
      result.stateAccessors.push(variable.name);
    }

    return result;
  }

  /**
   * Convert Flutter Bloc to React useReducer
   */
  convertBlocToUseReducer(bloc: BlocDefinition): StateConversionResult {
    const result: StateConversionResult = {
      imports: ["import { useReducer } from 'react';"],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
    };

    // Generate initial state
    const initialState = bloc.states[0];
    result.stateDeclarations.push(
      `const initialState = ${JSON.stringify(initialState.properties || {})};`
    );

    // Generate reducer function
    let reducerCode = `const ${bloc.name.toLowerCase()}Reducer = (state, action) => {\n`;
    reducerCode += `  switch (action.type) {\n`;

    for (const event of bloc.events) {
      const transition = bloc.transitions.find(t => t.event === event.name);
      if (transition) {
        reducerCode += `    case '${event.name}':\n`;
        reducerCode += `      ${transition.handler}\n`;
        reducerCode += `      return { ...state, /* updated state */ };\n`;
      }
    }

    reducerCode += `    default:\n`;
    reducerCode += `      return state;\n`;
    reducerCode += `  }\n`;
    reducerCode += `};\n`;

    result.stateDeclarations.push(reducerCode);

    // Generate useReducer hook
    result.stateDeclarations.push(
      `const [state, dispatch] = useReducer(${bloc.name.toLowerCase()}Reducer, initialState);`
    );

    // Generate action creators
    for (const event of bloc.events) {
      const actionCreator = `const ${this.camelCase(event.name)} = (${event.properties ? 'payload' : ''}) => dispatch({ type: '${event.name}'${event.properties ? ', payload' : ''} });`;
      result.stateUpdaters.push(actionCreator);
    }

    return result;
  }

  /**
   * Convert Flutter Riverpod to React Context/Hooks
   */
  convertRiverpodToContext(providerName: string, state: any): StateConversionResult {
    const result: StateConversionResult = {
      imports: [
        "import { createContext, useContext, useState, ReactNode } from 'react';",
      ],
      stateDeclarations: [],
      stateUpdaters: [],
      stateAccessors: [],
    };

    const contextName = `${this.capitalize(providerName)}Context`;

    // Generate context
    let contextCode = `interface ${contextName}Type {\n`;
    for (const [key, value] of Object.entries(state)) {
      contextCode += `  ${key}: ${typeof value};\n`;
      contextCode += `  set${this.capitalize(key)}: (value: ${typeof value}) => void;\n`;
    }
    contextCode += `}\n\n`;

    contextCode += `const ${contextName} = createContext<${contextName}Type | undefined>(undefined);\n\n`;

    // Generate provider component
    contextCode += `export const ${this.capitalize(providerName)}Provider = ({ children }: { children: ReactNode }) => {\n`;

    for (const [key, value] of Object.entries(state)) {
      contextCode += `  const [${key}, set${this.capitalize(key)}] = useState(${JSON.stringify(value)});\n`;
    }

    contextCode += `\n  const value = {\n`;
    for (const [key, _] of Object.entries(state)) {
      contextCode += `    ${key},\n`;
      contextCode += `    set${this.capitalize(key)},\n`;
    }
    contextCode += `  };\n\n`;

    contextCode += `  return (\n`;
    contextCode += `    <${contextName}.Provider value={value}>\n`;
    contextCode += `      {children}\n`;
    contextCode += `    </${contextName}.Provider>\n`;
    contextCode += `  );\n`;
    contextCode += `};\n\n`;

    // Generate custom hook
    contextCode += `export const use${this.capitalize(providerName)} = () => {\n`;
    contextCode += `  const context = useContext(${contextName});\n`;
    contextCode += `  if (!context) {\n`;
    contextCode += `    throw new Error('use${this.capitalize(providerName)} must be used within ${this.capitalize(providerName)}Provider');\n`;
    contextCode += `  }\n`;
    contextCode += `  return context;\n`;
    contextCode += `};\n`;

    result.stateDeclarations.push(contextCode);

    return result;
  }

  // Helper methods

  private generateBlocStateClass(name: string, initialState: any): string {
    let code = `class ${this.capitalize(name)}State {\n`;

    // Properties
    for (const [key, value] of Object.entries(initialState)) {
      code += `  final ${this.inferFlutterType(value)} ${key};\n`;
    }

    code += `\n  const ${this.capitalize(name)}State({\n`;
    for (const key of Object.keys(initialState)) {
      code += `    required this.${key},\n`;
    }
    code += `  });\n\n`;

    // copyWith method
    code += `  ${this.capitalize(name)}State copyWith({\n`;
    for (const [key, value] of Object.entries(initialState)) {
      code += `    ${this.inferFlutterType(value)}? ${key},\n`;
    }
    code += `  }) {\n`;
    code += `    return ${this.capitalize(name)}State(\n`;
    for (const key of Object.keys(initialState)) {
      code += `      ${key}: ${key} ?? this.${key},\n`;
    }
    code += `    );\n`;
    code += `  }\n`;

    code += `}\n`;

    return code;
  }

  private generateRiverpodStateClass(name: string, observables: Record<string, any>): string {
    return this.generateBlocStateClass(name, observables);
  }

  private getFlutterType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'int',
      'boolean': 'bool',
      'object': 'Map<String, dynamic>',
      'array': 'List<dynamic>',
    };
    return typeMap[type] || 'dynamic';
  }

  private inferFlutterType(value: any): string {
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) return 'List<dynamic>';
    if (typeof value === 'object') return 'Map<String, dynamic>';
    return 'dynamic';
  }

  private getTypeAnnotation(type: string): string {
    if (type === 'string') return '<string>';
    if (type === 'number') return '<number>';
    if (type === 'boolean') return '<boolean>';
    return '';
  }

  private getDefaultValue(type: string): string {
    if (type === 'string') return "''";
    if (type === 'number') return '0';
    if (type === 'boolean') return 'false';
    if (type === 'array') return '[]';
    if (type === 'object') return '{}';
    return 'null';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
               .replace(/^[A-Z]/, letter => letter.toLowerCase());
  }
}

// Singleton instance
let converterInstance: StateConverter | null = null;

export function getStateConverter(): StateConverter {
  if (!converterInstance) {
    converterInstance = new StateConverter();
  }
  return converterInstance;
}
