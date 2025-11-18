"use strict";
/**
 * @lumora/device - Device module for Lumora
 * Get device information, capabilities, and hardware details
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = exports.DeviceType = exports.DeviceModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.DeviceModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraDevice',
    methods: [
        // Device info
        (0, native_bridge_1.defineMethod)({
            name: 'getDeviceNameAsync',
            returnType: 'Promise<string>',
            description: 'Get device name',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getDeviceTypeAsync',
            returnType: 'Promise<DeviceType>',
            description: 'Get device type',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getManufacturerAsync',
            returnType: 'Promise<string>',
            description: 'Get device manufacturer',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getModelNameAsync',
            returnType: 'Promise<string>',
            description: 'Get device model name',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getModelIdAsync',
            returnType: 'Promise<string>',
            description: 'Get device model identifier',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getOsNameAsync',
            returnType: 'Promise<string>',
            description: 'Get OS name',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getOsVersionAsync',
            returnType: 'Promise<string>',
            description: 'Get OS version',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getOsBuildIdAsync',
            returnType: 'Promise<string>',
            description: 'Get OS build ID',
        }),
        // Hardware info
        (0, native_bridge_1.defineMethod)({
            name: 'getTotalMemoryAsync',
            returnType: 'Promise<number>',
            description: 'Get total device memory in bytes',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getSupportedCpuArchitecturesAsync',
            returnType: 'Promise<string[]>',
            description: 'Get supported CPU architectures',
        }),
        // Capabilities
        (0, native_bridge_1.defineMethod)({
            name: 'isDeviceAsync',
            returnType: 'Promise<boolean>',
            description: 'Check if running on physical device',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'isRootedAsync',
            returnType: 'Promise<boolean>',
            description: 'Check if device is rooted/jailbroken',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'hasTelephonyAsync',
            returnType: 'Promise<boolean>',
            description: 'Check if device has telephony capability',
        }),
        // Year class
        (0, native_bridge_1.defineMethod)({
            name: 'getYearClassAsync',
            returnType: 'Promise<number>',
            description: 'Get device year class (performance estimation)',
        }),
        // Device ID
        (0, native_bridge_1.defineMethod)({
            name: 'getDeviceIdAsync',
            returnType: 'Promise<string>',
            description: 'Get unique device identifier',
        }),
    ],
    constants: {
        brand: 'BRAND',
        manufacturer: 'MANUFACTURER',
        modelName: 'MODEL_NAME',
        modelId: 'MODEL_ID',
        osName: 'OS_NAME',
        osVersion: 'OS_VERSION',
        osBuildId: 'OS_BUILD_ID',
        platformApiLevel: 'PLATFORM_API_LEVEL',
        deviceName: 'DEVICE_NAME',
        deviceYearClass: 'DEVICE_YEAR_CLASS',
        totalMemory: 'TOTAL_MEMORY',
        supportedCpuArchitectures: 'SUPPORTED_CPU_ARCHITECTURES',
        isDevice: 'IS_DEVICE',
    },
    description: 'Access device information and capabilities',
});
// Types
var DeviceType;
(function (DeviceType) {
    DeviceType[DeviceType["UNKNOWN"] = 0] = "UNKNOWN";
    DeviceType[DeviceType["PHONE"] = 1] = "PHONE";
    DeviceType[DeviceType["TABLET"] = 2] = "TABLET";
    DeviceType[DeviceType["DESKTOP"] = 3] = "DESKTOP";
    DeviceType[DeviceType["TV"] = 4] = "TV";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
// Create and export proxy
exports.Device = (0, native_bridge_1.createModuleProxy)('LumoraDevice');
// Default export
exports.default = exports.Device;
//# sourceMappingURL=index.js.map