/**
 * State Adapters Module
 * Exports all state management adapters
 */
export { StateAdapter, BaseStateAdapter, AdapterConfig, GeneratedCode, } from './base-adapter';
export { BlocAdapter } from './bloc-adapter';
export { RiverpodAdapter } from './riverpod-adapter';
export { ProviderAdapter } from './provider-adapter';
/**
 * Adapter registry for easy access
 */
import { StateAdapter } from './base-adapter';
export type AdapterType = 'bloc' | 'riverpod' | 'provider';
/**
 * Get adapter by name
 */
export declare function getAdapter(type: AdapterType): StateAdapter;
/**
 * Get all available adapters
 */
export declare function getAllAdapters(): StateAdapter[];
/**
 * Check if adapter type is valid
 */
export declare function isValidAdapterType(type: string): type is AdapterType;
