/**
 * Native Bridge - Core communication layer
 * Enables React components to call native Flutter/platform code
 */
import { EventEmitter } from 'eventemitter3';
import { BridgeMessage, NativeModule, ModuleHandler } from './types';
export declare class NativeBridge extends EventEmitter {
    private config;
    private modules;
    private handlers;
    private pendingCalls;
    private callIdCounter;
    private connected;
    private messageQueue;
    constructor(config?: {
        timeout?: number;
        queueMessages?: boolean;
    });
    /**
     * Connect to native side
     */
    connect(): void;
    /**
     * Disconnect from native side
     */
    disconnect(): void;
    /**
     * Register a native module
     */
    registerModule(module: NativeModule, handler: ModuleHandler): void;
    /**
     * Unregister a module
     */
    unregisterModule(moduleName: string): void;
    /**
     * Call a native method
     */
    callMethod(moduleName: string, methodName: string, args?: any[]): Promise<any>;
    /**
     * Handle message from native side
     */
    handleMessage(message: BridgeMessage): void;
    /**
     * Query available modules
     */
    private queryModules;
    /**
     * Handle method response
     */
    private handleMethodResponse;
    /**
     * Handle native event
     */
    private handleEvent;
    /**
     * Handle modules list
     */
    private handleModulesList;
    /**
     * Handle native calling JS (for callbacks)
     */
    private handleNativeMethodCall;
    /**
     * Send message to native side
     */
    private sendMessage;
    /**
     * Generate unique call ID
     */
    private generateCallId;
    /**
     * Get registered modules
     */
    getModules(): NativeModule[];
    /**
     * Get specific module
     */
    getModule(name: string): NativeModule | undefined;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get pending calls count
     */
    getPendingCallsCount(): number;
}
/**
 * Get or create native bridge instance
 */
export declare function getNativeBridge(config?: {
    timeout?: number;
    queueMessages?: boolean;
}): NativeBridge;
/**
 * Create a new native bridge instance
 */
export declare function createNativeBridge(config?: {
    timeout?: number;
    queueMessages?: boolean;
}): NativeBridge;
//# sourceMappingURL=native-bridge.d.ts.map