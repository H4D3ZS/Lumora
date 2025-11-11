/**
 * State Management Bridge
 * Converts state management patterns between React and Flutter
 */
import { StateDefinition, StateVariable } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
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
export declare class StateBridge {
    private errorHandler;
    private config;
    constructor(config?: StateBridgeConfig);
    /**
     * Convert React state to Flutter code
     */
    convertReactToFlutter(state: StateDefinition, componentName: string): string;
    /**
     * Convert local React state to Flutter StatefulWidget
     */
    private convertLocalStateToFlutter;
    /**
     * Convert global React state to Flutter Bloc
     */
    private convertGlobalStateToFlutter;
    /**
     * Generate Bloc state management code
     */
    private generateBlocState;
    /**
     * Generate Bloc event class
     */
    private generateBlocEvent;
    /**
     * Generate Bloc event handler
     */
    private generateBlocEventHandler;
    /**
     * Generate Riverpod state management code
     */
    private generateRiverpodState;
    /**
     * Generate Riverpod method
     */
    private generateRiverpodMethod;
    /**
     * Generate Provider state management code
     */
    private generateProviderState;
    /**
     * Generate Provider setter
     */
    private generateProviderSetter;
    /**
     * Generate GetX state management code
     */
    private generateGetXState;
    /**
     * Generate GetX method
     */
    private generateGetXMethod;
    /**
     * Generate setter method for StatefulWidget
     */
    private generateSetterMethod;
    /**
     * Map TypeScript type to Flutter/Dart type
     */
    private mapTypeToFlutter;
    /**
     * Format initial value for Dart
     */
    private formatInitialValue;
    /**
     * Format initial value for Flutter with type awareness
     */
    private formatInitialValueForFlutter;
    /**
     * Capitalize first letter
     */
    private capitalize;
    /**
     * Uncapitalize first letter
     */
    private uncapitalize;
    /**
     * Convert React useState to Flutter StatefulWidget state
     */
    convertUseStateToFlutter(hookInfo: ReactHookInfo, componentName: string): string;
    /**
     * Convert React useContext to Flutter InheritedWidget
     */
    convertUseContextToInheritedWidget(hookInfo: ReactHookInfo, componentName: string): string;
    /**
     * Convert React useReducer to Flutter Bloc
     */
    convertUseReducerToBloc(hookInfo: ReactHookInfo, componentName: string): string;
    /**
     * Generate Bloc event from reducer action
     */
    private generateBlocEventFromAction;
    /**
     * Generate Bloc event handler from reducer action
     */
    private generateBlocEventHandlerFromAction;
    /**
     * Convert Flutter state to React hooks code
     */
    convertFlutterToReact(flutterState: FlutterStateInfo, componentName: string): string;
    /**
     * Convert StatefulWidget to React useState hooks
     */
    private convertStatefulWidgetToReact;
    /**
     * Generate useState hook from Flutter state variable
     */
    private generateUseStateHook;
    /**
     * Convert InheritedWidget to React Context
     */
    private convertInheritedWidgetToContext;
    /**
     * Convert Bloc to React useReducer
     */
    private convertBlocToUseReducer;
    /**
     * Convert Riverpod to React hooks
     */
    private convertRiverpodToReact;
    /**
     * Convert Provider to React hooks
     */
    private convertProviderToReact;
    /**
     * Map Flutter/Dart type to TypeScript type
     */
    private mapFlutterTypeToTS;
    /**
     * Format Flutter value for React
     */
    private formatFlutterValueForReact;
    /**
     * Serialize state for preservation
     */
    serializeState(state: Record<string, any>): string;
    /**
     * Deserialize state from preserved format
     */
    deserializeState(serialized: string): Record<string, any>;
    /**
     * Preserve state during hot reload
     * Merges old state values into new state structure
     */
    preserveState(oldState: Record<string, any>, newState: Record<string, any>): Record<string, any>;
    /**
     * Check if two values have matching types
     */
    private typesMatch;
    /**
     * Get the type of a value
     */
    private getValueType;
    /**
     * Migrate state from old structure to new structure
     * Handles schema changes during development
     */
    migrateState(oldState: Record<string, any>, oldDefinition: StateDefinition, newDefinition: StateDefinition): Record<string, any>;
    /**
     * Check if a value can be converted from one type to another
     */
    private canConvertType;
    /**
     * Convert a value from one type to another
     */
    private convertValue;
    /**
     * Generate state preservation code for Flutter
     */
    generateFlutterStatePreservation(componentName: string, stateVars: StateVariable[]): string;
    /**
     * Get SharedPreferences method name for type
     */
    private getPrefsMethod;
    /**
     * Generate state preservation code for React
     */
    generateReactStatePreservation(componentName: string, stateVars: StateVariable[]): string;
    /**
     * Create a state snapshot for debugging
     */
    createStateSnapshot(state: Record<string, any>, definition: StateDefinition): StateSnapshot;
    /**
     * Compare two state snapshots
     */
    compareStateSnapshots(snapshot1: StateSnapshot, snapshot2: StateSnapshot): StateComparison;
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
