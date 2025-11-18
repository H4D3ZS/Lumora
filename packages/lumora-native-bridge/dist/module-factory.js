"use strict";
/**
 * Module Factory - Helper functions for creating native modules
 * Simplifies the process of defining and registering native modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNativeModule = createNativeModule;
exports.createModuleProxy = createModuleProxy;
exports.registerModule = registerModule;
exports.defineMethod = defineMethod;
exports.NativeModuleDecorator = NativeModuleDecorator;
exports.createTypedModuleProxy = createTypedModuleProxy;
const native_bridge_1 = require("./native-bridge");
/**
 * Create a native module
 */
function createNativeModule(config) {
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
function createModuleProxy(moduleName) {
    const bridge = (0, native_bridge_1.getNativeBridge)();
    const module = bridge.getModule(moduleName);
    if (!module) {
        throw new Error(`Module "${moduleName}" not registered`);
    }
    const proxy = {};
    // Add methods
    for (const method of module.methods) {
        proxy[method.name] = async (...args) => {
            return bridge.callMethod(moduleName, method.name, args);
        };
    }
    // Add constants
    if (module.constants) {
        Object.assign(proxy, module.constants);
    }
    // Add event listeners
    proxy.addListener = (eventName, callback) => {
        bridge.on(`native:event:${moduleName}:${eventName}`, callback);
        return () => {
            bridge.off(`native:event:${moduleName}:${eventName}`, callback);
        };
    };
    proxy.removeListener = (eventName, callback) => {
        bridge.off(`native:event:${moduleName}:${eventName}`, callback);
    };
    return proxy;
}
/**
 * Register a module with implementation
 */
function registerModule(module, implementation) {
    const handler = {
        invoke: async (method, args) => {
            const impl = implementation[method];
            if (!impl) {
                throw new Error(`Method "${method}" not implemented`);
            }
            return impl(...args);
        },
    };
    const bridge = (0, native_bridge_1.getNativeBridge)();
    bridge.registerModule(module, handler);
}
/**
 * Define a method
 */
function defineMethod(config) {
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
function NativeModuleDecorator(config) {
    return function (constructor) {
        const methods = [];
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
        const implementation = {};
        for (const method of methods) {
            implementation[method.name] = (...args) => {
                return instance[method.name](...args);
            };
        }
        registerModule(module, implementation);
        return constructor;
    };
}
/**
 * Create a typed module proxy
 */
function createTypedModuleProxy(moduleName) {
    const bridge = (0, native_bridge_1.getNativeBridge)();
    return {
        name: moduleName,
        call: async (method, ...args) => {
            return bridge.callMethod(moduleName, String(method), args);
        },
        addListener: (event, callback) => {
            bridge.on(`native:event:${moduleName}:${event}`, callback);
            return () => {
                bridge.off(`native:event:${moduleName}:${event}`, callback);
            };
        },
        removeListener: (event, callback) => {
            bridge.off(`native:event:${moduleName}:${event}`, callback);
        },
    };
}
//# sourceMappingURL=module-factory.js.map