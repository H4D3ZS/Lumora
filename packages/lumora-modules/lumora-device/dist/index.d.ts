/**
 * @lumora/device - Device module for Lumora
 * Get device information, capabilities, and hardware details
 */
export declare const DeviceModule: import("@lumora/native-bridge").NativeModule;
export declare enum DeviceType {
    UNKNOWN = 0,
    PHONE = 1,
    TABLET = 2,
    DESKTOP = 3,
    TV = 4
}
export interface DeviceInfo {
    brand: string;
    manufacturer: string;
    modelName: string;
    modelId: string;
    osName: string;
    osVersion: string;
    osBuildId: string;
    platformApiLevel?: number;
    deviceName: string;
    deviceType: DeviceType;
    deviceYearClass: number;
    totalMemory: number;
    supportedCpuArchitectures: string[];
    isDevice: boolean;
    isRooted?: boolean;
    hasTelephony?: boolean;
}
export interface DeviceAPI {
    getDeviceNameAsync(): Promise<string>;
    getDeviceTypeAsync(): Promise<DeviceType>;
    getManufacturerAsync(): Promise<string>;
    getModelNameAsync(): Promise<string>;
    getModelIdAsync(): Promise<string>;
    getOsNameAsync(): Promise<string>;
    getOsVersionAsync(): Promise<string>;
    getOsBuildIdAsync(): Promise<string>;
    getTotalMemoryAsync(): Promise<number>;
    getSupportedCpuArchitecturesAsync(): Promise<string[]>;
    isDeviceAsync(): Promise<boolean>;
    isRootedAsync(): Promise<boolean>;
    hasTelephonyAsync(): Promise<boolean>;
    getYearClassAsync(): Promise<number>;
    getDeviceIdAsync(): Promise<string>;
    brand: string;
    manufacturer: string;
    modelName: string;
    modelId: string;
    osName: string;
    osVersion: string;
    osBuildId: string;
    platformApiLevel: number | null;
    deviceName: string;
    deviceYearClass: number;
    totalMemory: number;
    supportedCpuArchitectures: string[];
    isDevice: boolean;
}
export declare const Device: DeviceAPI;
export default Device;
//# sourceMappingURL=index.d.ts.map