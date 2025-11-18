/**
 * @lumora/device - Device module for Lumora
 * Get device information, capabilities, and hardware details
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
} from '@lumora/native-bridge';

// Module definition
export const DeviceModule = createNativeModule({
  name: 'LumoraDevice',
  methods: [
    // Device info
    defineMethod({
      name: 'getDeviceNameAsync',
      returnType: 'Promise<string>',
      description: 'Get device name',
    }),
    defineMethod({
      name: 'getDeviceTypeAsync',
      returnType: 'Promise<DeviceType>',
      description: 'Get device type',
    }),
    defineMethod({
      name: 'getManufacturerAsync',
      returnType: 'Promise<string>',
      description: 'Get device manufacturer',
    }),
    defineMethod({
      name: 'getModelNameAsync',
      returnType: 'Promise<string>',
      description: 'Get device model name',
    }),
    defineMethod({
      name: 'getModelIdAsync',
      returnType: 'Promise<string>',
      description: 'Get device model identifier',
    }),
    defineMethod({
      name: 'getOsNameAsync',
      returnType: 'Promise<string>',
      description: 'Get OS name',
    }),
    defineMethod({
      name: 'getOsVersionAsync',
      returnType: 'Promise<string>',
      description: 'Get OS version',
    }),
    defineMethod({
      name: 'getOsBuildIdAsync',
      returnType: 'Promise<string>',
      description: 'Get OS build ID',
    }),

    // Hardware info
    defineMethod({
      name: 'getTotalMemoryAsync',
      returnType: 'Promise<number>',
      description: 'Get total device memory in bytes',
    }),
    defineMethod({
      name: 'getSupportedCpuArchitecturesAsync',
      returnType: 'Promise<string[]>',
      description: 'Get supported CPU architectures',
    }),

    // Capabilities
    defineMethod({
      name: 'isDeviceAsync',
      returnType: 'Promise<boolean>',
      description: 'Check if running on physical device',
    }),
    defineMethod({
      name: 'isRootedAsync',
      returnType: 'Promise<boolean>',
      description: 'Check if device is rooted/jailbroken',
    }),
    defineMethod({
      name: 'hasTelephonyAsync',
      returnType: 'Promise<boolean>',
      description: 'Check if device has telephony capability',
    }),

    // Year class
    defineMethod({
      name: 'getYearClassAsync',
      returnType: 'Promise<number>',
      description: 'Get device year class (performance estimation)',
    }),

    // Device ID
    defineMethod({
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
export enum DeviceType {
  UNKNOWN = 0,
  PHONE = 1,
  TABLET = 2,
  DESKTOP = 3,
  TV = 4,
}

export interface DeviceInfo {
  // Brand and manufacturer
  brand: string;
  manufacturer: string;

  // Model information
  modelName: string;
  modelId: string;

  // OS information
  osName: string;
  osVersion: string;
  osBuildId: string;
  platformApiLevel?: number;

  // Device details
  deviceName: string;
  deviceType: DeviceType;
  deviceYearClass: number;

  // Hardware
  totalMemory: number;
  supportedCpuArchitectures: string[];

  // Status
  isDevice: boolean;
  isRooted?: boolean;
  hasTelephony?: boolean;
}

// API
export interface DeviceAPI {
  // Device info
  getDeviceNameAsync(): Promise<string>;
  getDeviceTypeAsync(): Promise<DeviceType>;
  getManufacturerAsync(): Promise<string>;
  getModelNameAsync(): Promise<string>;
  getModelIdAsync(): Promise<string>;
  getOsNameAsync(): Promise<string>;
  getOsVersionAsync(): Promise<string>;
  getOsBuildIdAsync(): Promise<string>;

  // Hardware info
  getTotalMemoryAsync(): Promise<number>;
  getSupportedCpuArchitecturesAsync(): Promise<string[]>;

  // Capabilities
  isDeviceAsync(): Promise<boolean>;
  isRootedAsync(): Promise<boolean>;
  hasTelephonyAsync(): Promise<boolean>;

  // Year class
  getYearClassAsync(): Promise<number>;

  // Device ID
  getDeviceIdAsync(): Promise<string>;

  // Constants (synchronous access)
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

// Create and export proxy
export const Device = createModuleProxy<DeviceAPI>('LumoraDevice');

// Default export
export default Device;
