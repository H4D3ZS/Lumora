import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// Generates stable keys for widgets
///
/// Ensures widgets maintain their identity across updates for efficient
/// rebuilding and state preservation. Handles key conflicts and preserves
/// keys during hot reload updates.
class KeyGenerator {
  final Map<String, Key> _keyCache = {};
  final Map<String, int> _keyConflicts = {};
  final Set<String> _preservedKeys = {};

  /// Generate a stable key for a node ID
  /// 
  /// Keys are cached to ensure the same node always gets the same key,
  /// which is critical for Flutter's widget reconciliation and state preservation.
  Key generateKey(String nodeId) {
    // Check if we have a cached key
    if (_keyCache.containsKey(nodeId)) {
      return _keyCache[nodeId]!;
    }

    // Generate new key
    final key = _createKey(nodeId);
    _keyCache[nodeId] = key;
    
    return key;
  }

  /// Create a new key, handling conflicts
  Key _createKey(String nodeId) {
    // Check for conflicts
    if (_keyConflicts.containsKey(nodeId)) {
      final conflictCount = _keyConflicts[nodeId]!;
      _keyConflicts[nodeId] = conflictCount + 1;
      
      // Create a unique key by appending conflict count
      final uniqueId = '${nodeId}_$conflictCount';
      debugPrint('KeyGenerator: Conflict detected for "$nodeId", using "$uniqueId"');
      return ValueKey(uniqueId);
    }

    // No conflict, use node ID directly
    return ValueKey(nodeId);
  }

  /// Mark a key as preserved during updates
  /// 
  /// Preserved keys will not be cleared during cache cleanup,
  /// ensuring state is maintained across hot reload.
  void preserveKey(String nodeId) {
    _preservedKeys.add(nodeId);
  }

  /// Unmark a key as preserved
  void unpreserveKey(String nodeId) {
    _preservedKeys.remove(nodeId);
  }

  /// Check if a key is preserved
  bool isPreserved(String nodeId) {
    return _preservedKeys.contains(nodeId);
  }

  /// Register a potential key conflict
  /// 
  /// Call this when you detect that a node ID might be reused.
  /// The next call to generateKey for this ID will create a unique variant.
  void registerConflict(String nodeId) {
    _keyConflicts[nodeId] = (_keyConflicts[nodeId] ?? 0) + 1;
  }

  /// Clear the key cache, optionally preserving marked keys
  /// 
  /// Use [preserveMarked] = true during hot reload to maintain state.
  void clearCache({bool preserveMarked = false}) {
    if (preserveMarked) {
      // Remove only non-preserved keys
      _keyCache.removeWhere((nodeId, key) => !_preservedKeys.contains(nodeId));
      debugPrint('KeyGenerator: Cleared cache, preserved ${_preservedKeys.length} keys');
    } else {
      _keyCache.clear();
      _preservedKeys.clear();
      debugPrint('KeyGenerator: Cleared all keys');
    }
  }

  /// Clear conflict tracking
  void clearConflicts() {
    _keyConflicts.clear();
  }

  /// Get cache size
  int get cacheSize => _keyCache.length;

  /// Get number of preserved keys
  int get preservedCount => _preservedKeys.length;

  /// Get number of tracked conflicts
  int get conflictCount => _keyConflicts.length;

  /// Get all cached node IDs
  List<String> get cachedNodeIds => _keyCache.keys.toList();

  /// Check if a node ID has a cached key
  bool hasKey(String nodeId) {
    return _keyCache.containsKey(nodeId);
  }

  /// Remove a specific key from cache
  /// 
  /// Returns true if the key was removed, false if it didn't exist.
  bool removeKey(String nodeId) {
    final removed = _keyCache.remove(nodeId) != null;
    _preservedKeys.remove(nodeId);
    return removed;
  }

  /// Prepare for hot reload by preserving all current keys
  /// 
  /// Call this before applying a schema update to ensure
  /// widget state is maintained.
  void prepareForUpdate() {
    // Mark all current keys as preserved
    _preservedKeys.addAll(_keyCache.keys);
    debugPrint('KeyGenerator: Prepared for update, preserved ${_preservedKeys.length} keys');
  }

  /// Clean up after hot reload
  /// 
  /// Removes keys that were preserved but not used in the new schema.
  void cleanupAfterUpdate(Set<String> usedNodeIds) {
    final unusedKeys = _preservedKeys.difference(usedNodeIds);
    
    for (final nodeId in unusedKeys) {
      _keyCache.remove(nodeId);
      _preservedKeys.remove(nodeId);
    }
    
    if (unusedKeys.isNotEmpty) {
      debugPrint('KeyGenerator: Cleaned up ${unusedKeys.length} unused keys');
    }
  }
}
