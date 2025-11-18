/**
 * Module Factory - Helper functions for creating native modules
 * Simplifies the process of defining and registering native modules
 */
import { NativeModule, NativeMethod } from './types';
/**
 * Create a native module
 */
export declare function createNativeModule(config: {
    name: string;
    methods: NativeMethod[];
    events?: string[];
    constants?: Record<string, any>;
    description?: string;
}): NativeModule;
/**
 * Create a proxy for a native module
 * Returns an object with methods that automatically call the bridge
 */
export declare function createModuleProxy<T = any>(moduleName: string): T;
/**
 * Register a module with implementation
 */
export declare function registerModule(module: NativeModule, implementation: Record<string, (...args: any[]) => Promise<any> | any>): void;
/**
 * Define a method
 */
export declare function defineMethod(config: {
    name: string;
    parameters?: Array<{
        name: string;
        type: string;
        optional?: boolean;
        default?: any;
    }>;
    returnType?: string;
    description?: string;
    platform?: 'ios' | 'android' | 'all';
}): NativeMethod;
/**
 * Decorator for native modules (TypeScript)
 */
export declare function NativeModuleDecorator(config: {
    name: string;
    events?: string[];
    constants?: Record<string, any>;
    description?: string;
}): <T extends {
    new (...args: any[]): any;
}>(constructor: T) => T;
/**
 * Create a typed native module interface
 */
export interface TypedNativeModule<T> {
    name: string;
    call<K extends keyof T>(method: K, ...args: Parameters<T[K] extends (...args: any) => any ? T[K] : never>): Promise<ReturnType<T[K] extends (...args: any) => any ? T[K] : never>>;
    addListener(event: string, callback: (data: any) => void): () => void;
    removeListener(event: string, callback: (data: any) => void): void;
}
/**
 * Create a typed module proxy
 */
export declare function createTypedModuleProxy<T extends Record<string, (...args: any[]) => any>>(moduleName: string): TypedNativeModule<T>;
//# sourceMappingURL=module-factory.d.ts.map