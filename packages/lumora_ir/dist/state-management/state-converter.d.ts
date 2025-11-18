/**
 * State Management Converter
 * Handles conversion between different state management patterns
 * React (useState, useReducer, Redux, MobX, Context) ↔ Flutter (setState, Bloc, Riverpod, Provider)
 */
import { StateDefinition } from '../types/ir-types';
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
export declare class StateConverter {
    /**
     * Convert React useState to Flutter setState
     */
    convertUseStateToSetState(state: StateDefinition): StateConversionResult;
    /**
     * Convert React useReducer to Flutter Bloc/Cubit
     */
    convertUseReducerToBloc(reducer: ReducerDefinition): StateConversionResult;
    /**
     * Convert Redux to Flutter Bloc
     */
    convertReduxToBloc(redux: ReduxDefinition): StateConversionResult;
    /**
     * Convert MobX to Flutter GetX or Riverpod
     */
    convertMobXToRiverpod(mobx: MobXDefinition): StateConversionResult;
    /**
     * Convert Flutter setState to React useState
     */
    convertSetStateToUseState(state: StateDefinition): StateConversionResult;
    /**
     * Convert Flutter Bloc to React useReducer
     */
    convertBlocToUseReducer(bloc: BlocDefinition): StateConversionResult;
    /**
     * Convert Flutter Riverpod to React Context/Hooks
     */
    convertRiverpodToContext(providerName: string, state: any): StateConversionResult;
    private generateBlocStateClass;
    private generateRiverpodStateClass;
    private getFlutterType;
    private inferFlutterType;
    private getTypeAnnotation;
    private getDefaultValue;
    private capitalize;
    private camelCase;
}
export declare function getStateConverter(): StateConverter;
