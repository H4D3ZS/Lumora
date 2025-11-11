/**
 * State Adapters Module
 * Exports all state management adapters
 */

export {
  StateAdapter,
  BaseStateAdapter,
  AdapterConfig,
  GeneratedCode,
} from './base-adapter';

export { BlocAdapter } from './bloc-adapter';
export { RiverpodAdapter } from './riverpod-adapter';
export { ProviderAdapter } from './provider-adapter';

/**
 * Adapter registry for easy access
 */
import { StateAdapter } from './base-adapter';
import { BlocAdapter } from './bloc-adapter';
import { RiverpodAdapter } from './riverpod-adapter';
import { ProviderAdapter } from './provider-adapter';

export type AdapterType = 'bloc' | 'riverpod' | 'provider';

/**
 * Get adapter by name
 */
export function getAdapter(type: AdapterType): StateAdapter {
  switch (type) {
    case 'bloc':
      return new BlocAdapter();
    case 'riverpod':
      return new RiverpodAdapter();
    case 'provider':
      return new ProviderAdapter();
    default:
      throw new Error(`Unknown adapter type: ${type}`);
  }
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): StateAdapter[] {
  return [
    new BlocAdapter(),
    new RiverpodAdapter(),
    new ProviderAdapter(),
  ];
}

/**
 * Check if adapter type is valid
 */
export function isValidAdapterType(type: string): type is AdapterType {
  return ['bloc', 'riverpod', 'provider'].includes(type);
}
