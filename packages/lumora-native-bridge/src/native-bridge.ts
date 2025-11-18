/**
 * Native Bridge - Core communication layer
 * Enables React components to call native Flutter/platform code
 */

import { EventEmitter } from 'eventemitter3';
import {
  BridgeMessage,
  MethodCallRequest,
  MethodCallResponse,
  NativeModule,
  ModuleHandler,
  NativeEvent,
} from './types';

export class NativeBridge extends EventEmitter {
  private modules: Map<string, NativeModule> = new Map();
  private handlers: Map<string, ModuleHandler> = new Map();
  private pendingCalls: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private callIdCounter = 0;
  private connected = false;
  private messageQueue: BridgeMessage[] = [];

  constructor(private config: {
    timeout?: number;
    queueMessages?: boolean;
  } = {}) {
    super();
    this.config.timeout = config.timeout || 30000; // 30 seconds default
    this.config.queueMessages = config.queueMessages !== false;
  }

  /**
   * Connect to native side
   */
  connect(): void {
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
  disconnect(): void {
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
  registerModule(module: NativeModule, handler: ModuleHandler): void {
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
  unregisterModule(moduleName: string): void {
    this.modules.delete(moduleName);
    this.handlers.delete(moduleName);
    this.emit('module:unregistered', moduleName);
  }

  /**
   * Call a native method
   */
  async callMethod(
    moduleName: string,
    methodName: string,
    args: any[] = []
  ): Promise<any> {
    // Validate module exists
    if (!this.modules.has(moduleName)) {
      throw new Error(`Module "${moduleName}" not found`);
    }

    const module = this.modules.get(moduleName)!;
    const method = module.methods.find(m => m.name === methodName);

    if (!method) {
      throw new Error(`Method "${methodName}" not found in module "${moduleName}"`);
    }

    // Generate call ID
    const callId = this.generateCallId();

    // Create request
    const request: MethodCallRequest = {
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
  handleMessage(message: BridgeMessage): void {
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
  private queryModules(): void {
    this.sendMessage({
      type: 'query_modules',
      payload: {},
    });
  }

  /**
   * Handle method response
   */
  private handleMethodResponse(response: MethodCallResponse): void {
    const pending = this.pendingCalls.get(response.callId);

    if (!pending) {
      console.warn(`Received response for unknown call ID: ${response.callId}`);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingCalls.delete(response.callId);

    if (response.success) {
      pending.resolve(response.result);
    } else {
      const error = new Error(response.error?.message || 'Unknown error');
      (error as any).code = response.error?.code;
      (error as any).stack = response.error?.stack;
      pending.reject(error);
    }
  }

  /**
   * Handle native event
   */
  private handleEvent(event: NativeEvent): void {
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
  private handleModulesList(modules: NativeModule[]): void {
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
  private async handleNativeMethodCall(request: MethodCallRequest): Promise<void> {
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
    } catch (error: any) {
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
  private sendMessage(message: BridgeMessage): void {
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
  private generateCallId(): string {
    return `call_${++this.callIdCounter}_${Date.now()}`;
  }

  /**
   * Get registered modules
   */
  getModules(): NativeModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get specific module
   */
  getModule(name: string): NativeModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get pending calls count
   */
  getPendingCallsCount(): number {
    return this.pendingCalls.size;
  }
}

// Singleton instance
let bridgeInstance: NativeBridge | null = null;

/**
 * Get or create native bridge instance
 */
export function getNativeBridge(config?: {
  timeout?: number;
  queueMessages?: boolean;
}): NativeBridge {
  if (!bridgeInstance) {
    bridgeInstance = new NativeBridge(config);
  }
  return bridgeInstance;
}

/**
 * Create a new native bridge instance
 */
export function createNativeBridge(config?: {
  timeout?: number;
  queueMessages?: boolean;
}): NativeBridge {
  return new NativeBridge(config);
}
