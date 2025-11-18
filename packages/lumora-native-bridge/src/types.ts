/**
 * Native Bridge Types
 * Type definitions for the Lumora native module bridge
 */

// Module method signature
export interface NativeMethod {
  name: string;
  parameters: NativeParameter[];
  returnType: string;
  description?: string;
  platform?: 'ios' | 'android' | 'all';
}

// Parameter definition
export interface NativeParameter {
  name: string;
  type: string;
  optional?: boolean;
  default?: any;
}

// Native module definition
export interface NativeModule {
  name: string;
  methods: NativeMethod[];
  events?: string[];
  constants?: Record<string, any>;
  description?: string;
}

// Method call request
export interface MethodCallRequest {
  module: string;
  method: string;
  arguments: any[];
  callId: string;
}

// Method call response
export interface MethodCallResponse {
  callId: string;
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

// Event emission
export interface NativeEvent {
  module: string;
  event: string;
  data: any;
  timestamp: number;
}

// Bridge message types
export type BridgeMessage =
  | { type: 'method_call'; payload: MethodCallRequest }
  | { type: 'method_response'; payload: MethodCallResponse }
  | { type: 'event'; payload: NativeEvent }
  | { type: 'register_module'; payload: NativeModule }
  | { type: 'query_modules'; payload: {} }
  | { type: 'modules_list'; payload: NativeModule[] };

// Module registry
export interface ModuleRegistry {
  modules: Map<string, NativeModule>;
  handlers: Map<string, ModuleHandler>;
}

// Module handler
export interface ModuleHandler {
  invoke(method: string, args: any[]): Promise<any>;
  addEventListener?(event: string, callback: (data: any) => void): void;
  removeEventListener?(event: string, callback: (data: any) => void): void;
}

// Permission types
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined',
  RESTRICTED = 'restricted',
}

export interface PermissionRequest {
  permission: string;
  rationale?: string;
}

export interface PermissionResponse {
  permission: string;
  status: PermissionStatus;
}
