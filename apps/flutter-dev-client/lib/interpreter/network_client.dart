/// Network client for handling HTTP requests in Lumora runtime
///
/// This client provides a framework-agnostic way to make network requests
/// based on the Lumora Network Schema. It supports:
/// - Request/response handling
/// - Interceptors for middleware
/// - Error handling with retries
/// - Loading state management
library;

import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// HTTP methods supported by the network client
enum HttpMethod {
  get,
  post,
  put,
  patch,
  delete,
  head,
  options,
}

/// Network request configuration
class NetworkRequest {
  final String url;
  final HttpMethod method;
  final Map<String, String>? headers;
  final dynamic body;
  final Duration? timeout;
  final bool requiresAuth;

  const NetworkRequest({
    required this.url,
    required this.method,
    this.headers,
    this.body,
    this.timeout,
    this.requiresAuth = false,
  });

  Map<String, dynamic> toJson() => {
        'url': url,
        'method': method.name,
        'headers': headers,
        'body': body,
        'timeout': timeout?.inMilliseconds,
        'requiresAuth': requiresAuth,
      };
}

/// Network response wrapper
class NetworkResponse<T> {
  final int statusCode;
  final String statusText;
  final Map<String, String> headers;
  final T? data;
  final String? error;
  final Duration? duration;

  const NetworkResponse({
    required this.statusCode,
    required this.statusText,
    required this.headers,
    this.data,
    this.error,
    this.duration,
  });

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
  bool get isError => !isSuccess;

  Map<String, dynamic> toJson() => {
        'statusCode': statusCode,
        'statusText': statusText,
        'headers': headers,
        'data': data,
        'error': error,
        'duration': duration?.inMilliseconds,
      };
}

/// Network error with detailed information
class NetworkError implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  final dynamic details;
  final StackTrace? stackTrace;

  const NetworkError({
    required this.message,
    this.code,
    this.statusCode,
    this.details,
    this.stackTrace,
  });

  @override
  String toString() => 'NetworkError: $message (code: $code, status: $statusCode)';

  Map<String, dynamic> toJson() => {
        'message': message,
        'code': code,
        'statusCode': statusCode,
        'details': details,
      };
}

/// Request interceptor function type
typedef RequestInterceptor = FutureOr<NetworkRequest> Function(NetworkRequest request);

/// Response interceptor function type
typedef ResponseInterceptor = FutureOr<NetworkResponse> Function(NetworkResponse response);

/// Error interceptor function type
typedef ErrorInterceptor = FutureOr<NetworkError> Function(NetworkError error);

/// Retry configuration
class RetryConfig {
  final bool enabled;
  final int maxAttempts;
  final Duration initialDelay;
  final Duration maxDelay;
  final double backoffMultiplier;
  final List<int> retryableStatusCodes;
  final bool retryOnNetworkError;
  final bool retryOnTimeout;

  const RetryConfig({
    this.enabled = true,
    this.maxAttempts = 3,
    this.initialDelay = const Duration(seconds: 1),
    this.maxDelay = const Duration(seconds: 10),
    this.backoffMultiplier = 2.0,
    this.retryableStatusCodes = const [408, 429, 500, 502, 503, 504],
    this.retryOnNetworkError = true,
    this.retryOnTimeout = true,
  });

  Duration getDelay(int attempt) {
    if (attempt == 0) return initialDelay;
    
    final multiplier = backoffMultiplier * attempt;
    final delayMs = initialDelay.inMilliseconds * multiplier;
    final delay = Duration(milliseconds: delayMs.toInt());
    
    return delay > maxDelay ? maxDelay : delay;
  }

  bool shouldRetry(NetworkError error, int attempt) {
    if (!enabled || attempt >= maxAttempts) return false;

    if (error.statusCode != null && retryableStatusCodes.contains(error.statusCode)) {
      return true;
    }

    if (error.code == 'NETWORK_ERROR' && retryOnNetworkError) {
      return true;
    }

    if (error.code == 'TIMEOUT' && retryOnTimeout) {
      return true;
    }

    return false;
  }
}

/// Main network client for making HTTP requests
class NetworkClient {
  final http.Client _httpClient;
  final String? baseURL;
  final Map<String, String> defaultHeaders;
  final Duration defaultTimeout;
  final RetryConfig retryConfig;

  final List<RequestInterceptor> _requestInterceptors = [];
  final List<ResponseInterceptor> _responseInterceptors = [];
  final List<ErrorInterceptor> _errorInterceptors = [];

  NetworkClient({
    http.Client? httpClient,
    this.baseURL,
    Map<String, String>? defaultHeaders,
    Duration? defaultTimeout,
    RetryConfig? retryConfig,
  })  : _httpClient = httpClient ?? http.Client(),
        defaultHeaders = defaultHeaders ?? {'Content-Type': 'application/json'},
        defaultTimeout = defaultTimeout ?? const Duration(seconds: 30),
        retryConfig = retryConfig ?? const RetryConfig();

  /// Add a request interceptor
  void addRequestInterceptor(RequestInterceptor interceptor) {
    _requestInterceptors.add(interceptor);
  }

  /// Add a response interceptor
  void addResponseInterceptor(ResponseInterceptor interceptor) {
    _responseInterceptors.add(interceptor);
  }

  /// Add an error interceptor
  void addErrorInterceptor(ErrorInterceptor interceptor) {
    _errorInterceptors.add(interceptor);
  }

  /// Make a network request with retry logic
  Future<NetworkResponse<T>> request<T>(
    NetworkRequest request, {
    T Function(dynamic)? parser,
  }) async {
    int attempt = 0;
    NetworkError? lastError;

    while (attempt < retryConfig.maxAttempts) {
      try {
        return await _executeRequest<T>(request, parser: parser);
      } on NetworkError catch (error) {
        lastError = error;

        // Run error interceptors
        for (final interceptor in _errorInterceptors) {
          lastError = await interceptor(lastError!);
        }

        if (!retryConfig.shouldRetry(lastError!, attempt)) {
          rethrow;
        }

        attempt++;
        if (attempt < retryConfig.maxAttempts) {
          await Future.delayed(retryConfig.getDelay(attempt));
        }
      }
    }

    throw lastError ?? const NetworkError(message: 'Request failed after retries');
  }

  /// Execute a single network request
  Future<NetworkResponse<T>> _executeRequest<T>(
    NetworkRequest request, {
    T Function(dynamic)? parser,
  }) async {
    final startTime = DateTime.now();

    try {
      // Apply request interceptors
      var modifiedRequest = request;
      for (final interceptor in _requestInterceptors) {
        modifiedRequest = await interceptor(modifiedRequest);
      }

      // Build full URL
      final url = _buildUrl(modifiedRequest.url);

      // Merge headers
      final headers = {...defaultHeaders, ...?modifiedRequest.headers};

      // Make HTTP request
      final timeout = modifiedRequest.timeout ?? defaultTimeout;
      http.Response httpResponse;

      switch (modifiedRequest.method) {
        case HttpMethod.get:
          httpResponse = await _httpClient.get(url, headers: headers).timeout(timeout);
          break;
        case HttpMethod.post:
          httpResponse = await _httpClient
              .post(url, headers: headers, body: _encodeBody(modifiedRequest.body))
              .timeout(timeout);
          break;
        case HttpMethod.put:
          httpResponse = await _httpClient
              .put(url, headers: headers, body: _encodeBody(modifiedRequest.body))
              .timeout(timeout);
          break;
        case HttpMethod.patch:
          httpResponse = await _httpClient
              .patch(url, headers: headers, body: _encodeBody(modifiedRequest.body))
              .timeout(timeout);
          break;
        case HttpMethod.delete:
          httpResponse = await _httpClient
              .delete(url, headers: headers, body: _encodeBody(modifiedRequest.body))
              .timeout(timeout);
          break;
        case HttpMethod.head:
          httpResponse = await _httpClient.head(url, headers: headers).timeout(timeout);
          break;
        case HttpMethod.options:
          throw UnimplementedError('OPTIONS method not yet supported');
      }

      final duration = DateTime.now().difference(startTime);

      // Parse response
      final data = _parseResponse<T>(httpResponse, parser);

      var response = NetworkResponse<T>(
        statusCode: httpResponse.statusCode,
        statusText: httpResponse.reasonPhrase ?? '',
        headers: httpResponse.headers,
        data: data,
        duration: duration,
      );

      // Apply response interceptors
      for (final interceptor in _responseInterceptors) {
        response = await interceptor(response) as NetworkResponse<T>;
      }

      // Check for HTTP errors
      if (!response.isSuccess) {
        throw NetworkError(
          message: 'HTTP ${response.statusCode}: ${response.statusText}',
          code: 'HTTP_ERROR',
          statusCode: response.statusCode,
          details: response.data,
        );
      }

      return response;
    } on TimeoutException catch (e, stackTrace) {
      throw NetworkError(
        message: 'Request timeout after ${request.timeout ?? defaultTimeout}',
        code: 'TIMEOUT',
        details: e.toString(),
        stackTrace: stackTrace,
      );
    } on http.ClientException catch (e, stackTrace) {
      throw NetworkError(
        message: 'Network error: ${e.message}',
        code: 'NETWORK_ERROR',
        details: e.toString(),
        stackTrace: stackTrace,
      );
    } catch (e, stackTrace) {
      throw NetworkError(
        message: 'Unexpected error: $e',
        code: 'UNKNOWN_ERROR',
        details: e.toString(),
        stackTrace: stackTrace,
      );
    }
  }

  /// Build full URL from base URL and path
  Uri _buildUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return Uri.parse(path);
    }

    if (baseURL == null) {
      throw ArgumentError('baseURL is required for relative paths');
    }

    final base = baseURL!.endsWith('/') ? baseURL!.substring(0, baseURL!.length - 1) : baseURL;
    final cleanPath = path.startsWith('/') ? path : '/$path';

    return Uri.parse('$base$cleanPath');
  }

  /// Encode request body
  String? _encodeBody(dynamic body) {
    if (body == null) return null;
    if (body is String) return body;
    return jsonEncode(body);
  }

  /// Parse HTTP response
  T? _parseResponse<T>(http.Response response, T Function(dynamic)? parser) {
    if (response.body.isEmpty) return null;

    try {
      final decoded = jsonDecode(response.body);
      return parser != null ? parser(decoded) : decoded as T?;
    } catch (e) {
      // If JSON parsing fails, return raw body as string
      return response.body as T?;
    }
  }

  /// Close the HTTP client
  void close() {
    _httpClient.close();
  }
}
