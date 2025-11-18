/**
 * Module Factory - Helper functions for creating native modules
 * Simplifies the process of defining and registering native modules
 */

import { NativeModule, NativeMethod, ModuleHandler } from './types';
import { getNativeBridge } from './native-bridge';

/**
 * Create a native module
 */
export function createNativeModule(config: {
  name: string;
  methods: NativeMethod[];
  events?: string[];
  constants?: Record<string, any>;
  description?: string;
}): NativeModule {
  return {
    name: config.name,
    methods: config.methods,
    events: config.events || [],
    constants: config.constants || {},
    description: config.description,
  };
}

/**
 * Create a proxy for a native module
 * Returns an object with methods that automatically call the bridge
 */
export function createModuleProxy<T = any>(moduleName: string): T {
  const bridge = getNativeBridge();
  const module = bridge.getModule(moduleName);

  if (!module) {
    throw new Error(`Module "${moduleName}" not registered`);
  }

  const proxy: any = {};

  // Add methods
  for (const method of module.methods) {
    proxy[method.name] = async (...args: any[]) => {
      return bridge.callMethod(moduleName, method.name, args);
    };
  }

  // Add constants
  if (module.constants) {
    Object.assign(proxy, module.constants);
  }

  // Add event listeners
  proxy.addListener = (eventName: string, callback: (data: any) => void) => {
    bridge.on(`native:event:${moduleName}:${eventName}`, callback);
    return () => {
      bridge.off(`native:event:${moduleName}:${eventName}`, callback);
    };
  };

  proxy.removeListener = (eventName: string, callback: (data: any) => void) => {
    bridge.off(`native:event:${moduleName}:${eventName}`, callback);
  };

  return proxy as T;
}

/**
 * Register a module with implementation
 */
export function registerModule(
  module: NativeModule,
  implementation: Record<string, (...args: any[]) => Promise<any> | any>
): void {
  const handler: ModuleHandler = {
    invoke: async (method: string, args: any[]) => {
      const impl = implementation[method];
      if (!impl) {
        throw new Error(`Method "${method}" not implemented`);
      }
      return impl(...args);
    },
  };

  const bridge = getNativeBridge();
  bridge.registerModule(module, handler);
}

/**
 * Define a method
 */
export function defineMethod(config: {
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
}): NativeMethod {
  return {
    name: config.name,
    parameters: config.parameters || [],
    returnType: config.returnType || 'void',
    description: config.description,
    platform: config.platform || 'all',
  };
}

/**
 * Decorator for native modules (TypeScript)
 */
export function NativeModuleDecorator(config: {
  name: string;
  events?: string[];
  constants?: Record<string, any>;
  description?: string;
}) {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    const methods: NativeMethod[] = [];

    // Extract methods from prototype
    const prototype = constructor.prototype;
    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key !== 'constructor' && typeof prototype[key] === 'function') {
        methods.push({
          name: key,
          parameters: [],
          returnType: 'any',
        });
      }
    }

    const module = createNativeModule({
      name: config.name,
      methods,
      events: config.events,
      constants: config.constants,
      description: config.description,
    });

    // Auto-register
    const instance = new constructor();
    const implementation: Record<string, any> = {};

    for (const method of methods) {
      implementation[method.name] = (...args: any[]) => {
        return instance[method.name](...args);
      };
    }

    registerModule(module, implementation);

    return constructor;
  };
}

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
export function createTypedModuleProxy<T extends Record<string, (...args: any[]) => any>>(
  moduleName: string
): TypedNativeModule<T> {
  const bridge = getNativeBridge();

  return {
    name: moduleName,
    call: async (method: any, ...args: any[]) => {
      return bridge.callMethod(moduleName, String(method), args);
    },
    addListener: (event: string, callback: (data: any) => void) => {
      bridge.on(`native:event:${moduleName}:${event}`, callback);
      return () => {
        bridge.off(`native:event:${moduleName}:${event}`, callback);
      };
    },
    removeListener: (event: string, callback: (data: any) => void) => {
      bridge.off(`native:event:${moduleName}:${event}`, callback);
    },
  };
}
