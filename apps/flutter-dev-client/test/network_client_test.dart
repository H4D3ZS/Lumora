import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/network_client.dart';
import 'package:flutter_dev_client/interpreter/network_manager.dart';

void main() {
  group('NetworkClient', () {
    test('creates request with correct properties', () {
      final request = NetworkRequest(
        url: 'https://api.example.com/users',
        method: HttpMethod.get,
        headers: {'Authorization': 'Bearer token'},
      );

      expect(request.url, 'https://api.example.com/users');
      expect(request.method, HttpMethod.get);
      expect(request.headers?['Authorization'], 'Bearer token');
    });

    test('NetworkResponse indicates success for 2xx status codes', () {
      const response = NetworkResponse(
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        data: {'message': 'success'},
      );

      expect(response.isSuccess, true);
      expect(response.isError, false);
    });

    test('NetworkResponse indicates error for 4xx status codes', () {
      const response = NetworkResponse(
        statusCode: 404,
        statusText: 'Not Found',
        headers: {},
      );

      expect(response.isSuccess, false);
      expect(response.isError, true);
    });

    test('NetworkError contains correct information', () {
      const error = NetworkError(
        message: 'Request failed',
        code: 'HTTP_ERROR',
        statusCode: 500,
      );

      expect(error.message, 'Request failed');
      expect(error.code, 'HTTP_ERROR');
      expect(error.statusCode, 500);
    });

    test('RetryConfig calculates delay correctly', () {
      const config = RetryConfig(
        initialDelay: Duration(seconds: 1),
        backoffMultiplier: 2.0,
        maxDelay: Duration(seconds: 10),
      );

      expect(config.getDelay(0), const Duration(seconds: 1));
      expect(config.getDelay(1), const Duration(seconds: 2)); // 1s * 2.0 * 1
      expect(config.getDelay(2), const Duration(seconds: 4)); // 1s * 2.0 * 2
      expect(config.getDelay(3), const Duration(seconds: 6)); // 1s * 2.0 * 3
      expect(config.getDelay(4), const Duration(seconds: 8)); // 1s * 2.0 * 4
      expect(config.getDelay(5), const Duration(seconds: 10)); // capped at maxDelay
    });

    test('RetryConfig determines retry eligibility', () {
      const config = RetryConfig(
        maxAttempts: 3,
        retryableStatusCodes: [500, 502, 503],
        retryOnNetworkError: true,
      );

      // Should retry on retryable status code
      expect(
        config.shouldRetry(
          const NetworkError(message: 'Server error', statusCode: 500),
          0,
        ),
        true,
      );

      // Should not retry on non-retryable status code
      expect(
        config.shouldRetry(
          const NetworkError(message: 'Not found', statusCode: 404),
          0,
        ),
        false,
      );

      // Should retry on network error
      expect(
        config.shouldRetry(
          const NetworkError(message: 'Network error', code: 'NETWORK_ERROR'),
          0,
        ),
        true,
      );

      // Should not retry after max attempts
      expect(
        config.shouldRetry(
          const NetworkError(message: 'Server error', statusCode: 500),
          3,
        ),
        false,
      );
    });
  });

  group('NetworkManager', () {
    test('tracks request state correctly', () {
      final manager = NetworkManager(baseURL: 'https://api.example.com');

      expect(manager.hasLoadingRequests, false);
      expect(manager.requests.isEmpty, true);
    });

    test('identifies loading state for endpoint', () {
      final manager = NetworkManager(baseURL: 'https://api.example.com');

      expect(manager.isEndpointLoading('test-endpoint'), false);
    });

    test('NetworkRequestInfo calculates duration', () {
      final startTime = DateTime.now();
      final endTime = startTime.add(const Duration(seconds: 2));

      final info = NetworkRequestInfo(
        endpointId: 'test',
        requestId: 'req-1',
        state: NetworkRequestState.success,
        startTime: startTime,
        endTime: endTime,
      );

      expect(info.duration, const Duration(seconds: 2));
    });

    test('NetworkRequestInfo copyWith creates new instance', () {
      const original = NetworkRequestInfo(
        endpointId: 'test',
        requestId: 'req-1',
        state: NetworkRequestState.loading,
      );

      final updated = original.copyWith(
        state: NetworkRequestState.success,
      );

      expect(updated.state, NetworkRequestState.success);
      expect(updated.endpointId, 'test');
      expect(updated.requestId, 'req-1');
    });
  });

  group('HttpMethod', () {
    test('has all standard HTTP methods', () {
      expect(HttpMethod.values.length, 7);
      expect(HttpMethod.values.contains(HttpMethod.get), true);
      expect(HttpMethod.values.contains(HttpMethod.post), true);
      expect(HttpMethod.values.contains(HttpMethod.put), true);
      expect(HttpMethod.values.contains(HttpMethod.patch), true);
      expect(HttpMethod.values.contains(HttpMethod.delete), true);
      expect(HttpMethod.values.contains(HttpMethod.head), true);
      expect(HttpMethod.values.contains(HttpMethod.options), true);
    });
  });

  group('NetworkRequestState', () {
    test('has all required states', () {
      expect(NetworkRequestState.values.length, 5);
      expect(NetworkRequestState.values.contains(NetworkRequestState.idle), true);
      expect(NetworkRequestState.values.contains(NetworkRequestState.loading), true);
      expect(NetworkRequestState.values.contains(NetworkRequestState.success), true);
      expect(NetworkRequestState.values.contains(NetworkRequestState.error), true);
      expect(NetworkRequestState.values.contains(NetworkRequestState.cancelled), true);
    });
  });
}
