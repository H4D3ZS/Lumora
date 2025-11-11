/**
 * State Bridge Module
 * Exports state conversion functionality
 */

export {
  StateBridge,
  StateBridgeConfig,
  ReactHookInfo,
  ReducerAction,
  FlutterStateInfo,
  FlutterStateVariable,
  FlutterStateMethod,
  StateSnapshot,
  StateChange,
  StateComparison,
} from './state-bridge';

// Export adapters
export {
  StateAdapter,
  BaseStateAdapter,
  AdapterConfig,
  GeneratedCode,
  BlocAdapter,
  RiverpodAdapter,
  ProviderAdapter,
  AdapterType,
  getAdapter,
  getAllAdapters,
  isValidAdapterType,
} from './adapters';
