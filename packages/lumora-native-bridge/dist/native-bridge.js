"use strict";
/**
 * Native Bridge - Core communication layer
 * Enables React components to call native Flutter/platform code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBridge = void 0;
exports.getNativeBridge = getNativeBridge;
exports.createNativeBridge = createNativeBridge;
const eventemitter3_1 = require("eventemitter3");
class NativeBridge extends eventemitter3_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.modules = new Map();
        this.handlers = new Map();
        this.pendingCalls = new Map();
        this.callIdCounter = 0;
        this.connected = false;
        this.messageQueue = [];
        this.config.timeout = config.timeout || 30000; // 30 seconds default
        this.config.queueMessages = config.queueMessages !== false;
    }
    /**
     * Connect to native side
     */
    connect() {
        this.connected = true;
        this.emit('connected');
        // Flush queued messages
        if (this.messageQueue.length > 0) {
            for (const message of this.messageQueue) {
                this.sendMessage(message);
            }
            this.messageQueue = [];
        }
        // Query available modules
        this.queryModules();
    }
    /**
     * Disconnect from native side
     */
    disconnect() {
        this.connected = false;
        this.emit('disconnected');
        // Reject all pending calls
        for (const [callId, { reject, timeout }] of this.pendingCalls) {
            clearTimeout(timeout);
            reject(new Error('Bridge disconnected'));
        }
        this.pendingCalls.clear();
    }
    /**
     * Register a native module
     */
    registerModule(module, handler) {
        this.modules.set(module.name, module);
        this.handlers.set(module.name, handler);
        // Notify native side
        this.sendMessage({
            type: 'register_module',
            payload: module,
        });
        this.emit('module:registered', module);
    }
    /**
     * Unregister a module
     */
    unregisterModule(moduleName) {
        this.modules.delete(moduleName);
        this.handlers.delete(moduleName);
        this.emit('module:unregistered', moduleName);
    }
    /**
     * Call a native method
     */
    async callMethod(moduleName, methodName, args = []) {
        // Validate module exists
        if (!this.modules.has(moduleName)) {
            throw new Error(`Module "${moduleName}" not found`);
        }
        const module = this.modules.get(moduleName);
        const method = module.methods.find(m => m.name === methodName);
        if (!method) {
            throw new Error(`Method "${methodName}" not found in module "${moduleName}"`);
        }
        // Generate call ID
        const callId = this.generateCallId();
        // Create request
        const request = {
            module: moduleName,
            method: methodName,
            arguments: args,
            callId,
        };
        // Send message
        this.sendMessage({
            type: 'method_call',
            payload: request,
        });
        // Wait for response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCalls.delete(callId);
                reject(new Error(`Method call timeout: ${moduleName}.${methodName}`));
            }, this.config.timeout);
            this.pendingCalls.set(callId, { resolve, reject, timeout });
        });
    }
    /**
     * Handle message from native side
     */
    handleMessage(message) {
        switch (message.type) {
            case 'method_response':
                this.handleMethodResponse(message.payload);
                break;
            case 'event':
                this.handleEvent(message.payload);
                break;
            case 'modules_list':
                this.handleModulesList(message.payload);
                break;
            case 'method_call':
                // Native calling JS (for callbacks)
                this.handleNativeMethodCall(message.payload);
                break;
        }
    }
    /**
     * Query available modules
     */
    queryModules() {
        this.sendMessage({
            type: 'query_modules',
            payload: {},
        });
    }
    /**
     * Handle method response
     */
    handleMethodResponse(response) {
        const pending = this.pendingCalls.get(response.callId);
        if (!pending) {
            console.warn(`Received response for unknown call ID: ${response.callId}`);
            return;
        }
        clearTimeout(pending.timeout);
        this.pendingCalls.delete(response.callId);
        if (response.success) {
            pending.resolve(response.result);
        }
        else {
            const error = new Error(response.error?.message || 'Unknown error');
            error.code = response.error?.code;
            error.stack = response.error?.stack;
            pending.reject(error);
        }
    }
    /**
     * Handle native event
     */
    handleEvent(event) {
        this.emit('native:event', event);
        this.emit(`native:event:${event.module}:${event.event}`, event.data);
        // Forward to module handler if it has event listeners
        const handler = this.handlers.get(event.module);
        if (handler && handler.addEventListener) {
            // Event is already emitted, handlers should listen to this bridge
        }
    }
    /**
     * Handle modules list
     */
    handleModulesList(modules) {
        for (const module of modules) {
            if (!this.modules.has(module.name)) {
                this.modules.set(module.name, module);
            }
        }
        this.emit('modules:loaded', modules);
    }
    /**
     * Handle native calling JS (for callbacks)
     */
    async handleNativeMethodCall(request) {
        try {
            const handler = this.handlers.get(request.module);
            if (!handler) {
                throw new Error(`Module handler not found: ${request.module}`);
            }
            const result = await handler.invoke(request.method, request.arguments);
            this.sendMessage({
                type: 'method_response',
                payload: {
                    callId: request.callId,
                    success: true,
                    result,
                },
            });
        }
        catch (error) {
            this.sendMessage({
                type: 'method_response',
                payload: {
                    callId: request.callId,
                    success: false,
                    error: {
                        code: error.code || 'ERROR',
                        message: error.message,
                        stack: error.stack,
                    },
                },
            });
        }
    }
    /**
     * Send message to native side
     */
    sendMessage(message) {
        if (!this.connected && this.config.queueMessages) {
            this.messageQueue.push(message);
            return;
        }
        // Emit message event for transport layer to handle
        this.emit('message:send', message);
    }
    /**
     * Generate unique call ID
     */
    generateCallId() {
        return `call_${++this.callIdCounter}_${Date.now()}`;
    }
    /**
     * Get registered modules
     */
    getModules() {
        return Array.from(this.modules.values());
    }
    /**
     * Get specific module
     */
    getModule(name) {
        return this.modules.get(name);
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get pending calls count
     */
    getPendingCallsCount() {
        return this.pendingCalls.size;
    }
}
exports.NativeBridge = NativeBridge;
// Singleton instance
let bridgeInstance = null;
/**
 * Get or create native bridge instance
 */
function getNativeBridge(config) {
    if (!bridgeInstance) {
        bridgeInstance = new NativeBridge(config);
    }
    return bridgeInstance;
}
/**
 * Create a new native bridge instance
 */
function createNativeBridge(config) {
    return new NativeBridge(config);
}
//# sourceMappingURL=native-bridge.js.map