import 'dart:async';
import 'package:flutter/foundation.dart';

/// Callback type for synchronous event handlers
typedef EventCallback = void Function(Map<String, dynamic>? data);

/// Callback type for asynchronous event handlers
typedef AsyncEventCallback = Future<void> Function(Map<String, dynamic>? data);

/// Callback type for error handlers
typedef EventErrorHandler = void Function(String eventId, dynamic error, StackTrace stackTrace);

/// Bridges events between the UI and the runtime
///
/// Handles user interactions and can send events to the dev server
/// when connected. Supports both synchronous and asynchronous event
/// handlers with comprehensive error handling.
class EventBridge {
  EventBridge({EventErrorHandler? errorHandler})
      : _errorHandler = errorHandler ?? _defaultErrorHandler;

  final Map<String, EventCallback> _handlers = {};
  final Map<String, AsyncEventCallback> _asyncHandlers = {};
  final List<EventListener> _listeners = [];
  final EventErrorHandler _errorHandler;

  /// Default error handler that logs to debug console
  static void _defaultErrorHandler(String eventId, dynamic error, StackTrace stackTrace) {
    debugPrint('EventBridge: Error in event handler "$eventId": $error');
    debugPrint(stackTrace.toString());
  }

  /// Register a synchronous event handler
  ///
  /// The handler will be called immediately when the event is triggered.
  /// If an async handler is already registered for this event, it will be replaced.
  void registerHandler(String eventId, EventCallback callback) {
    _handlers[eventId] = callback;
    _asyncHandlers.remove(eventId); // Remove async handler if exists
  }

  /// Register an asynchronous event handler
  ///
  /// The handler will be called asynchronously when the event is triggered.
  /// If a sync handler is already registered for this event, it will be replaced.
  void registerAsyncHandler(String eventId, AsyncEventCallback callback) {
    _asyncHandlers[eventId] = callback;
    _handlers.remove(eventId); // Remove sync handler if exists
  }

  /// Unregister an event handler (both sync and async)
  void unregisterHandler(String eventId) {
    _handlers.remove(eventId);
    _asyncHandlers.remove(eventId);
  }

  /// Create a handler function for a widget event
  ///
  /// Returns a VoidCallback that can be used with Flutter widgets.
  /// Handles errors gracefully and prevents exceptions from propagating.
  VoidCallback createHandler(
    String eventId, {
    Map<String, dynamic>? parameters,
  }) {
    return () {
      try {
        triggerEvent(eventId, parameters);
      } catch (e, stackTrace) {
        _errorHandler(eventId, e, stackTrace);
      }
    };
  }

  /// Create a handler function with data parameter
  ///
  /// Returns a Function that accepts dynamic data (e.g., text input value).
  /// Useful for onChange, onInput, and similar events.
  Function createHandlerWithData(
    String eventId, {
    Map<String, dynamic>? parameters,
  }) {
    return (dynamic data) {
      try {
        final eventData = <String, dynamic>{
          ...?parameters,
          'data': data,
        };
        triggerEvent(eventId, eventData);
      } catch (e, stackTrace) {
        _errorHandler(eventId, e, stackTrace);
      }
    };
  }

  /// Create an async handler function for a widget event
  ///
  /// Returns a VoidCallback that handles async operations.
  /// Useful for events that need to perform async operations like API calls.
  VoidCallback createAsyncHandler(
    String eventId, {
    Map<String, dynamic>? parameters,
  }) {
    return () {
      triggerEventAsync(eventId, parameters).catchError((error, stackTrace) {
        _errorHandler(eventId, error, stackTrace);
      });
    };
  }

  /// Create an async handler function with data parameter
  ///
  /// Returns a Function that accepts dynamic data and handles async operations.
  Function createAsyncHandlerWithData(
    String eventId, {
    Map<String, dynamic>? parameters,
  }) {
    return (dynamic data) {
      final eventData = <String, dynamic>{
        ...?parameters,
        'data': data,
      };
      triggerEventAsync(eventId, eventData).catchError((error, stackTrace) {
        _errorHandler(eventId, error, stackTrace);
      });
    };
  }

  /// Trigger a synchronous event
  ///
  /// Calls the registered handler and notifies all listeners.
  /// Errors are caught and passed to the error handler.
  void triggerEvent(String eventId, [Map<String, dynamic>? data]) {
    // Call registered sync handler
    final handler = _handlers[eventId];
    if (handler != null) {
      try {
        handler(data);
      } catch (e, stackTrace) {
        _errorHandler(eventId, e, stackTrace);
      }
    }

    // If no sync handler but async handler exists, trigger it
    if (handler == null && _asyncHandlers.containsKey(eventId)) {
      triggerEventAsync(eventId, data);
      return;
    }

    // Notify listeners (e.g., dev server connection)
    // This happens even if the handler failed
    _notifyListeners(eventId, data);
  }

  /// Trigger an asynchronous event
  ///
  /// Calls the registered async handler and notifies all listeners.
  /// Returns a Future that completes when the handler finishes.
  /// Errors are caught and passed to the error handler.
  Future<void> triggerEventAsync(String eventId, [Map<String, dynamic>? data]) async {
    // Call registered async handler
    final asyncHandler = _asyncHandlers[eventId];
    if (asyncHandler != null) {
      try {
        await asyncHandler(data);
      } catch (e, stackTrace) {
        _errorHandler(eventId, e, stackTrace);
      }
    } else {
      // Fall back to sync handler if no async handler exists
      final handler = _handlers[eventId];
      if (handler != null) {
        try {
          handler(data);
        } catch (e, stackTrace) {
          _errorHandler(eventId, e, stackTrace);
        }
      }
    }

    // Notify listeners (e.g., dev server connection)
    // This happens even if the handler failed
    _notifyListeners(eventId, data);
  }

  /// Notify all event listeners
  ///
  /// Listeners are notified even if the handler fails, ensuring
  /// dev server communication continues to work.
  void _notifyListeners(String eventId, Map<String, dynamic>? data) {
    // Create a copy to avoid concurrent modification
    final listenersCopy = List<EventListener>.from(_listeners);
    
    for (final listener in listenersCopy) {
      try {
        listener(eventId, data);
      } catch (e, stackTrace) {
        debugPrint('EventBridge: Error in event listener for "$eventId": $e');
        debugPrint(stackTrace.toString());
      }
    }
  }

  /// Add an event listener
  ///
  /// Listeners are notified whenever an event is triggered,
  /// regardless of whether a handler is registered.
  void addListener(EventListener listener) {
    _listeners.add(listener);
  }

  /// Remove an event listener
  void removeListener(EventListener listener) {
    _listeners.remove(listener);
  }

  /// Clear all handlers and listeners
  void clear() {
    _handlers.clear();
    _asyncHandlers.clear();
    _listeners.clear();
  }

  /// Check if an event handler is registered
  bool hasHandler(String eventId) {
    return _handlers.containsKey(eventId) || _asyncHandlers.containsKey(eventId);
  }

  /// Get all registered event IDs
  List<String> get registeredEvents {
    final events = <String>{};
    events.addAll(_handlers.keys);
    events.addAll(_asyncHandlers.keys);
    return events.toList();
  }

  /// Get the number of registered handlers
  int get handlerCount => _handlers.length + _asyncHandlers.length;

  /// Get the number of registered listeners
  int get listenerCount => _listeners.length;
}

/// Listener for event notifications
///
/// Called whenever an event is triggered, allowing external systems
/// (like dev server connections) to be notified of user interactions.
typedef EventListener = void Function(String eventId, Map<String, dynamic>? data);
