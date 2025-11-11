import 'package:flutter/foundation.dart';

/// Callback type for state change listeners
typedef StateChangeCallback = void Function(String name, dynamic oldValue, dynamic newValue);

/// Manages state for the Lumora runtime
///
/// Supports both local and global state, with change notifications
/// for reactive updates. Provides fine-grained listeners for specific
/// state variables and preserves state during hot reload.
class StateManager extends ChangeNotifier {
  final Map<String, dynamic> _localState = {};
  final Map<String, dynamic> _globalState = {};
  final Map<String, List<StateChangeCallback>> _stateListeners = {};
  
  // State preservation for hot reload
  final Map<String, dynamic> _preservedState = {};

  /// Get a state value by name
  ///
  /// Checks local state first, then global state.
  /// Returns null if the value doesn't exist.
  dynamic getValue(String name) {
    // Check local state first, then global
    return _localState[name] ?? _globalState[name];
  }

  /// Set a local state value
  ///
  /// Triggers change notifications to all listeners and specific
  /// listeners for this state variable.
  void setValue(String name, dynamic value) {
    final oldValue = _localState[name];
    
    // Only update and notify if value actually changed
    if (oldValue != value) {
      _localState[name] = value;
      
      // Notify specific listeners for this state variable
      _notifyStateListeners(name, oldValue, value);
      
      // Notify all general listeners
      notifyListeners();
    }
  }

  /// Set a global state value
  ///
  /// Global state is shared across all components.
  /// Triggers change notifications to all listeners.
  void setGlobalValue(String name, dynamic value) {
    final oldValue = _globalState[name];
    
    // Only update and notify if value actually changed
    if (oldValue != value) {
      _globalState[name] = value;
      
      // Notify specific listeners for this state variable
      _notifyStateListeners(name, oldValue, value);
      
      // Notify all general listeners
      notifyListeners();
    }
  }

  /// Initialize state from a map
  ///
  /// Used to set up initial state from schema definitions.
  /// Can initialize either local or global state.
  void initializeState(Map<String, dynamic> state, {bool global = false}) {
    if (global) {
      _globalState.addAll(state);
    } else {
      _localState.addAll(state);
    }
    notifyListeners();
  }

  /// Add a listener for a specific state variable
  ///
  /// This allows widgets to listen only to the state they care about,
  /// reducing unnecessary rebuilds.
  void addStateListener(String name, StateChangeCallback callback) {
    _stateListeners.putIfAbsent(name, () => []).add(callback);
  }

  /// Remove a listener for a specific state variable
  void removeStateListener(String name, StateChangeCallback callback) {
    _stateListeners[name]?.remove(callback);
    if (_stateListeners[name]?.isEmpty ?? false) {
      _stateListeners.remove(name);
    }
  }

  /// Notify listeners for a specific state variable
  void _notifyStateListeners(String name, dynamic oldValue, dynamic newValue) {
    final listeners = _stateListeners[name];
    if (listeners != null) {
      // Create a copy to avoid concurrent modification
      final listenersCopy = List<StateChangeCallback>.from(listeners);
      for (final listener in listenersCopy) {
        try {
          listener(name, oldValue, newValue);
        } catch (e, stackTrace) {
          debugPrint('Error in state listener for "$name": $e');
          debugPrint(stackTrace.toString());
        }
      }
    }
  }

  /// Preserve current state for hot reload
  ///
  /// Saves the current state so it can be restored after a hot reload.
  /// This ensures users don't lose their app state during development.
  void preserveState() {
    _preservedState.clear();
    _preservedState.addAll(_localState);
    _preservedState.addAll(_globalState.map((key, value) => MapEntry('__global_$key', value)));
  }

  /// Restore preserved state after hot reload
  ///
  /// Restores state that was saved before a hot reload.
  /// Restores all preserved values, creating state variables if needed.
  void restoreState() {
    for (final entry in _preservedState.entries) {
      final key = entry.key;
      final value = entry.value;
      
      if (key.startsWith('__global_')) {
        final globalKey = key.substring(9); // Remove '__global_' prefix
        _globalState[globalKey] = value;
      } else {
        _localState[key] = value;
      }
    }
    
    notifyListeners();
  }

  /// Merge preserved state with new state
  ///
  /// Used during hot reload to preserve user's state while
  /// accepting new initial values for new state variables.
  void mergePreservedState(Map<String, dynamic> newState, {bool global = false}) {
    final targetState = global ? _globalState : _localState;
    
    // Add new state variables with their initial values
    for (final entry in newState.entries) {
      if (!targetState.containsKey(entry.key)) {
        targetState[entry.key] = entry.value;
      }
    }
    
    // Restore preserved values for existing variables
    restoreState();
  }

  /// Clear local state
  void clearLocalState() {
    _localState.clear();
    notifyListeners();
  }

  /// Clear global state
  void clearGlobalState() {
    _globalState.clear();
    notifyListeners();
  }

  /// Clear all state (but not preserved state)
  void clearAll() {
    _localState.clear();
    _globalState.clear();
    _stateListeners.clear();
    notifyListeners();
  }
  
  /// Clear all state including preserved state
  void clearAllIncludingPreserved() {
    _localState.clear();
    _globalState.clear();
    _preservedState.clear();
    _stateListeners.clear();
    notifyListeners();
  }

  /// Get all local state
  Map<String, dynamic> get localState => Map.unmodifiable(_localState);

  /// Get all global state
  Map<String, dynamic> get globalState => Map.unmodifiable(_globalState);

  /// Check if a state variable exists
  bool hasValue(String name) {
    return _localState.containsKey(name) || _globalState.containsKey(name);
  }

  /// Get the number of registered state listeners
  int get listenerCount => _stateListeners.values.fold(0, (sum, list) => sum + list.length);

  @override
  void dispose() {
    _stateListeners.clear();
    super.dispose();
  }
}
