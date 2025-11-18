/**
 * Native Bridge Types
 * Type definitions for the Lumora native module bridge
 */
export interface NativeMethod {
    name: string;
    parameters: NativeParameter[];
    returnType: string;
    description?: string;
    platform?: 'ios' | 'android' | 'all';
}
export interface NativeParameter {
    name: string;
    type: string;
    optional?: boolean;
    default?: any;
}
export interface NativeModule {
    name: string;
    methods: NativeMethod[];
    events?: string[];
    constants?: Record<string, any>;
    description?: string;
}
export interface MethodCallRequest {
    module: string;
    method: string;
    arguments: any[];
    callId: string;
}
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
export interface NativeEvent {
    module: string;
    event: string;
    data: any;
    timestamp: number;
}
export type BridgeMessage = {
    type: 'method_call';
    payload: MethodCallRequest;
} | {
    type: 'method_response';
    payload: MethodCallResponse;
} | {
    type: 'event';
    payload: NativeEvent;
} | {
    type: 'register_module';
    payload: NativeModule;
} | {
    type: 'query_modules';
    payload: {};
} | {
    type: 'modules_list';
    payload: NativeModule[];
};
export interface ModuleRegistry {
    modules: Map<string, NativeModule>;
    handlers: Map<string, ModuleHandler>;
}
export interface ModuleHandler {
    invoke(method: string, args: any[]): Promise<any>;
    addEventListener?(event: string, callback: (data: any) => void): void;
    removeEventListener?(event: string, callback: (data: any) => void): void;
}
export declare enum PermissionStatus {
    GRANTED = "granted",
    DENIED = "denied",
    UNDETERMINED = "undetermined",
    RESTRICTED = "restricted"
}
export interface PermissionRequest {
    permission: string;
    rationale?: string;
}
export interface PermissionResponse {
    permission: string;
    status: PermissionStatus;
}
//# sourceMappingURL=types.d.ts.map