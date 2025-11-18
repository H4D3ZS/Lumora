/// Network manager for handling network operations in Lumora runtime
///
/// This manager integrates with the schema interpreter to execute network
/// requests defined in the Lumora IR schema. It manages:
/// - Network client lifecycle
/// - Request state tracking
/// - Loading indicators
/// - Error handling
library;

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'network_client.dart';

/// Network request state for tracking ongoing requests
enum NetworkRequestState {
  idle,
  loading,
  success,
  error,
  cancelled,
}

/// Network error class for handling error states
class NetworkError {
  final String message;
  final int? statusCode;
  final dynamic originalError;

  NetworkError({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => 'NetworkError: $message${statusCode != null ? ' (Status: $statusCode)' : ''}';
}

/// Network request info for state tracking
class NetworkRequestInfo {
  final String endpointId;
  final String requestId;
  final NetworkRequestState state;
  final NetworkRequest? request;
  final NetworkResponse? response;
  final NetworkError? error;
  final DateTime? startTime;
  final DateTime? endTime;

  const NetworkRequestInfo({
    required this.endpointId,
    required this.requestId,
    required this.state,
    this.request,
    this.response,
    this.error,
    this.startTime,
    this.endTime,
  });

  Duration? get duration {
    if (startTime == null || endTime == null) return null;
    return endTime!.difference(startTime!);
  }

  NetworkRequestInfo copyWith({
    NetworkRequestState? state,
    NetworkRequest? request,
    NetworkResponse? response,
    NetworkError? error,
    DateTime? startTime,
    DateTime? endTime,
  }) {
    return NetworkRequestInfo(
      endpointId: endpointId,
      requestId: requestId,
      state: state ?? this.state,
      request: request ?? this.request,
      response: response ?? this.response,
      error: error ?? this.error,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
    );
  }

  Map<String, dynamic> toJson() => {
        'endpointId': endpointId,
        'requestId': requestId,
        'state': state.name,
        'request': request?.toJson(),
        'response': response?.toJson(),
        'error': error?.toJson(),
        'startTime': startTime?.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'duration': duration?.inMilliseconds,
      };
}

/// Network manager for handling all network operations
class NetworkManager extends ChangeNotifier {
  final NetworkClient _client;
  final Map<String, NetworkRequestInfo> _requests = {};
  final Map<String, Completer<NetworkResponse>> _pendingRequests = {};

  NetworkManager({
    NetworkClient? client,
    String? baseURL,
    Map<String, String>? defaultHeaders,
    Duration? defaultTimeout,
    RetryConfig? retryConfig,
  }) : _client = client ??
            NetworkClient(
              baseURL: baseURL,
              defaultHeaders: defaultHeaders,
              defaultTimeout: defaultTimeout,
              retryConfig: retryConfig,
            );

  /// Get all tracked requests
  Map<String, NetworkRequestInfo> get requests => Map.unmodifiable(_requests);

  /// Get request info by ID
  NetworkRequestInfo? getRequest(String requestId) => _requests[requestId];

  /// Get all requests for a specific endpoint
  List<NetworkRequestInfo> getRequestsForEndpoint(String endpointId) {
    return _requests.values.where((r) => r.endpointId == endpointId).toList();
  }

  /// Check if any request is loading
  bool get hasLoadingRequests {
    return _requests.values.any((r) => r.state == NetworkRequestState.loading);
  }

  /// Check if a specific endpoint has loading requests
  bool isEndpointLoading(String endpointId) {
    return _requests.values.any(
      (r) => r.endpointId == endpointId && r.state == NetworkRequestState.loading,
    );
  }

  /// Execute a network request from schema definition
  Future<NetworkResponse<T>> executeRequest<T>({
    required String endpointId,
    required String url,
    required HttpMethod method,
    Map<String, String>? headers,
    dynamic body,
    Duration? timeout,
    bool requiresAuth = false,
    T Function(dynamic)? parser,
    String? requestId,
  }) async {
    final id = requestId ?? '${endpointId}_${DateTime.now().millisecondsSinceEpoch}';

    // Create request
    final request = NetworkRequest(
      url: url,
      method: method,
      headers: headers,
      body: body,
      timeout: timeout,
      requiresAuth: requiresAuth,
    );

    // Track request state
    _updateRequestState(
      id,
      NetworkRequestInfo(
        endpointId: endpointId,
        requestId: id,
        state: NetworkRequestState.loading,
        request: request,
        startTime: DateTime.now(),
      ),
    );

    try {
      // Execute request
      final response = await _client.request<T>(request, parser: parser);

      // Update state to success
      _updateRequestState(
        id,
        _requests[id]!.copyWith(
          state: NetworkRequestState.success,
          response: response,
          endTime: DateTime.now(),
        ),
      );

      return response;
    } on NetworkError catch (error) {
      // Update state to error
      _updateRequestState(
        id,
        _requests[id]!.copyWith(
          state: NetworkRequestState.error,
          error: error,
          endTime: DateTime.now(),
        ),
      );

      rethrow;
    } catch (error) {
      // Handle unexpected errors
      final networkError = NetworkError(
        message: 'Unexpected error: $error',
        code: 'UNKNOWN_ERROR',
        details: error.toString(),
      );

      _updateRequestState(
        id,
        _requests[id]!.copyWith(
          state: NetworkRequestState.error,
          error: networkError,
          endTime: DateTime.now(),
        ),
      );

      throw networkError;
    }
  }

  /// Execute a GET request
  Future<NetworkResponse<T>> get<T>(
    String endpointId,
    String url, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
    T Function(dynamic)? parser,
  }) async {
    final uri = Uri.parse(url);
    final fullUrl = queryParams != null
        ? uri.replace(queryParameters: {...uri.queryParameters, ...queryParams}).toString()
        : url;

    return executeRequest<T>(
      endpointId: endpointId,
      url: fullUrl,
      method: HttpMethod.get,
      headers: headers,
      parser: parser,
    );
  }

  /// Execute a POST request
  Future<NetworkResponse<T>> post<T>(
    String endpointId,
    String url, {
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? parser,
  }) {
    return executeRequest<T>(
      endpointId: endpointId,
      url: url,
      method: HttpMethod.post,
      headers: headers,
      body: body,
      parser: parser,
    );
  }

  /// Execute a PUT request
  Future<NetworkResponse<T>> put<T>(
    String endpointId,
    String url, {
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? parser,
  }) {
    return executeRequest<T>(
      endpointId: endpointId,
      url: url,
      method: HttpMethod.put,
      headers: headers,
      body: body,
      parser: parser,
    );
  }

  /// Execute a PATCH request
  Future<NetworkResponse<T>> patch<T>(
    String endpointId,
    String url, {
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? parser,
  }) {
    return executeRequest<T>(
      endpointId: endpointId,
      url: url,
      method: HttpMethod.patch,
      headers: headers,
      body: body,
      parser: parser,
    );
  }

  /// Execute a DELETE request
  Future<NetworkResponse<T>> delete<T>(
    String endpointId,
    String url, {
    Map<String, String>? headers,
    dynamic body,
    T Function(dynamic)? parser,
  }) {
    return executeRequest<T>(
      endpointId: endpointId,
      url: url,
      method: HttpMethod.delete,
      headers: headers,
      body: body,
      parser: parser,
    );
  }

  /// Cancel a pending request
  void cancelRequest(String requestId) {
    final request = _requests[requestId];
    if (request != null && request.state == NetworkRequestState.loading) {
      _updateRequestState(
        requestId,
        request.copyWith(
          state: NetworkRequestState.cancelled,
          endTime: DateTime.now(),
        ),
      );

      // Complete pending request with error
      final completer = _pendingRequests.remove(requestId);
      if (completer != null && !completer.isCompleted) {
        completer.completeError(
          const NetworkError(
            message: 'Request cancelled',
            code: 'CANCELLED',
          ),
        );
      }
    }
  }

  /// Cancel all pending requests for an endpoint
  void cancelEndpointRequests(String endpointId) {
    final endpointRequests = getRequestsForEndpoint(endpointId);
    for (final request in endpointRequests) {
      if (request.state == NetworkRequestState.loading) {
        cancelRequest(request.requestId);
      }
    }
  }

  /// Clear request history
  void clearRequests() {
    _requests.clear();
    notifyListeners();
  }

  /// Clear completed requests (success/error/cancelled)
  void clearCompletedRequests() {
    _requests.removeWhere((_, request) =>
        request.state == NetworkRequestState.success ||
        request.state == NetworkRequestState.error ||
        request.state == NetworkRequestState.cancelled);
    notifyListeners();
  }

  /// Add request interceptor
  void addRequestInterceptor(RequestInterceptor interceptor) {
    _client.addRequestInterceptor(interceptor);
  }

  /// Add response interceptor
  void addResponseInterceptor(ResponseInterceptor interceptor) {
    _client.addResponseInterceptor(interceptor);
  }

  /// Add error interceptor
  void addErrorInterceptor(ErrorInterceptor interceptor) {
    _client.addErrorInterceptor(interceptor);
  }

  /// Update request state and notify listeners
  void _updateRequestState(String requestId, NetworkRequestInfo info) {
    _requests[requestId] = info;
    notifyListeners();
  }

  /// Dispose resources
  @override
  void dispose() {
    _client.close();
    _pendingRequests.clear();
    super.dispose();
  }
}
