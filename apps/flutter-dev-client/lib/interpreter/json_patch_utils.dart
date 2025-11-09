import 'dart:developer' as developer;

/// Utility class for creating and working with JSON Patch (RFC 6902) format
/// 
/// JSON Patch is more efficient than full schema replacement for incremental updates
class JsonPatchUtils {
  /// Creates a JSON Patch 'add' operation
  static Map<String, dynamic> createAddOperation(String path, dynamic value) {
    return {
      'op': 'add',
      'path': path,
      'value': value,
    };
  }

  /// Creates a JSON Patch 'remove' operation
  static Map<String, dynamic> createRemoveOperation(String path) {
    return {
      'op': 'remove',
      'path': path,
    };
  }

  /// Creates a JSON Patch 'replace' operation
  static Map<String, dynamic> createReplaceOperation(String path, dynamic value) {
    return {
      'op': 'replace',
      'path': path,
      'value': value,
    };
  }

  /// Creates a JSON Patch 'move' operation
  static Map<String, dynamic> createMoveOperation(String from, String path) {
    return {
      'op': 'move',
      'from': from,
      'path': path,
    };
  }

  /// Creates a JSON Patch 'copy' operation
  static Map<String, dynamic> createCopyOperation(String from, String path) {
    return {
      'op': 'copy',
      'from': from,
      'path': path,
    };
  }

  /// Creates a JSON Patch 'test' operation
  static Map<String, dynamic> createTestOperation(String path, dynamic value) {
    return {
      'op': 'test',
      'path': path,
      'value': value,
    };
  }

  /// Creates a complete JSON Patch delta envelope
  static Map<String, dynamic> createPatchDelta(List<Map<String, dynamic>> operations) {
    return {
      'operations': operations,
    };
  }

  /// Validates a JSON Patch operation
  static bool isValidOperation(Map<String, dynamic> operation) {
    if (!operation.containsKey('op') || !operation.containsKey('path')) {
      return false;
    }

    final op = operation['op'];
    final validOps = ['add', 'remove', 'replace', 'move', 'copy', 'test'];
    
    if (!validOps.contains(op)) {
      return false;
    }

    // 'add', 'replace', and 'test' require 'value'
    if (['add', 'replace', 'test'].contains(op) && !operation.containsKey('value')) {
      return false;
    }

    // 'move' and 'copy' require 'from'
    if (['move', 'copy'].contains(op) && !operation.containsKey('from')) {
      return false;
    }

    return true;
  }

  /// Validates a batch of JSON Patch operations
  static bool isValidPatch(List<dynamic> operations) {
    if (operations.isEmpty) {
      return false;
    }

    for (final op in operations) {
      if (op is! Map<String, dynamic> || !isValidOperation(op)) {
        return false;
      }
    }

    return true;
  }

  /// Optimizes a batch of operations by merging redundant ones
  /// 
  /// For example, multiple 'replace' operations on the same path can be merged
  static List<Map<String, dynamic>> optimizeOperations(List<Map<String, dynamic>> operations) {
    if (operations.length <= 1) {
      return operations;
    }

    final optimized = <Map<String, dynamic>>[];
    final pathMap = <String, Map<String, dynamic>>{};

    for (final op in operations) {
      final path = op['path'] as String;
      final opType = op['op'] as String;

      // If we have a previous operation on the same path
      if (pathMap.containsKey(path)) {
        final prevOp = pathMap[path]!;
        final prevOpType = prevOp['op'] as String;

        // Merge logic
        if (opType == 'replace' && prevOpType == 'replace') {
          // Keep only the latest replace
          pathMap[path] = op;
          developer.log(
            'Optimized: merged replace operations on $path',
            name: 'JsonPatchUtils',
          );
          continue;
        } else if (opType == 'remove' && prevOpType == 'add') {
          // Add followed by remove = no-op
          pathMap.remove(path);
          developer.log(
            'Optimized: removed add+remove no-op on $path',
            name: 'JsonPatchUtils',
          );
          continue;
        }
      }

      pathMap[path] = op;
    }

    // Convert map back to list
    optimized.addAll(pathMap.values);

    if (optimized.length < operations.length) {
      developer.log(
        'Optimized ${operations.length} operations to ${optimized.length}',
        name: 'JsonPatchUtils',
      );
    }

    return optimized;
  }

  /// Estimates the size of a JSON Patch in bytes
  static int estimateSize(List<Map<String, dynamic>> operations) {
    // Rough estimate: each operation ~100 bytes on average
    return operations.length * 100;
  }

  /// Checks if using JSON Patch is more efficient than full schema replacement
  /// 
  /// Returns true if patch is smaller than threshold percentage of full schema
  static bool isPatchMoreEfficient(
    List<Map<String, dynamic>> operations,
    int fullSchemaSize, {
    double thresholdPercentage = 0.3, // 30% threshold
  }) {
    final patchSize = estimateSize(operations);
    final threshold = fullSchemaSize * thresholdPercentage;
    
    final isEfficient = patchSize < threshold;
    
    developer.log(
      'Patch efficiency check: patch=${patchSize}B, full=${fullSchemaSize}B, '
      'threshold=${threshold.toInt()}B, efficient=$isEfficient',
      name: 'JsonPatchUtils',
    );
    
    return isEfficient;
  }
}
