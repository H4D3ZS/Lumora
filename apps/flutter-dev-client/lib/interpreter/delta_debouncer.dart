import 'dart:async';
import 'dart:developer' as developer;

/// Debounces delta updates to batch multiple rapid changes
/// 
/// Queues incoming delta messages during a debounce window and applies
/// them as a single batch after the timer expires.
class DeltaDebouncer {
  final Duration debounceDuration;
  final Function(List<Map<String, dynamic>>) onBatchReady;

  Timer? _debounceTimer;
  final List<Map<String, dynamic>> _pendingDeltas = [];

  DeltaDebouncer({
    this.debounceDuration = const Duration(milliseconds: 300),
    required this.onBatchReady,
  });

  /// Adds a delta to the queue and starts/resets the debounce timer
  void addDelta(Map<String, dynamic> delta) {
    developer.log(
      'Delta queued (${_pendingDeltas.length + 1} pending)',
      name: 'DeltaDebouncer',
    );

    _pendingDeltas.add(delta);

    // Cancel existing timer if any
    _debounceTimer?.cancel();

    // Start new debounce timer
    _debounceTimer = Timer(debounceDuration, _processBatch);
  }

  /// Processes the batched deltas
  void _processBatch() {
    if (_pendingDeltas.isEmpty) {
      return;
    }

    developer.log(
      'Processing batch of ${_pendingDeltas.length} deltas',
      name: 'DeltaDebouncer',
    );

    // Create a copy of pending deltas
    final batch = List<Map<String, dynamic>>.from(_pendingDeltas);

    // Clear the queue
    _pendingDeltas.clear();

    // Invoke callback with batched deltas
    onBatchReady(batch);
  }

  /// Forces immediate processing of pending deltas
  void flush() {
    _debounceTimer?.cancel();
    _processBatch();
  }

  /// Cancels pending operations and clears the queue
  void cancel() {
    _debounceTimer?.cancel();
    _pendingDeltas.clear();
    developer.log('Debouncer cancelled', name: 'DeltaDebouncer');
  }

  /// Disposes resources
  void dispose() {
    _debounceTimer?.cancel();
    _pendingDeltas.clear();
  }

  /// Returns the number of pending deltas
  int get pendingCount => _pendingDeltas.length;

  /// Returns whether there are pending deltas
  bool get hasPending => _pendingDeltas.isNotEmpty;
}
