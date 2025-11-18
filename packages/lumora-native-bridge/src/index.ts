/**
 * Lumora Native Bridge
 * Enables React components to call native Flutter/platform code
 *
 * @example
 * ```typescript
 * import { getNativeBridge, createModuleProxy } from '@lumora/native-bridge';
 *
 * // Get bridge instance
 * const bridge = getNativeBridge();
 * bridge.connect();
 *
 * // Call native method
 * const camera = createModuleProxy('Camera');
 * const photo = await camera.takePicture({ quality: 0.8 });
 * ```
 */

export * from './types';
export * from './native-bridge';
export * from './module-factory';

// Re-export commonly used functions
export {
  getNativeBridge,
  createNativeBridge,
} from './native-bridge';

export {
  createNativeModule,
  createModuleProxy,
  createTypedModuleProxy,
  registerModule,
  defineMethod,
  NativeModuleDecorator,
} from './module-factory';
