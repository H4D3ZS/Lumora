import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/network_client.dart' as client;
import 'package:flutter_dev_client/interpreter/network_manager.dart' as manager;

void main() {
  group('NetworkClient', () {
    test('creates request with correct properties', () {
      final request = client.NetworkRequest(
        url: 'https://api.example.com/users',
        method: client.HttpMethod.get,
        headers: {'Authorization': 'Bearer token'},
      );

      expect(request.url, 'https://api.example.com/users');
      expect(request.method, client.HttpMethod.get);
      expect(request.headers?['Authorization'], 'Bearer token');
    });

    test('NetworkResponse indicates success for 2xx status codes', () {
      const response = client.NetworkResponse(
        statusCode: 200,
        statusText: 'OK',
        headers: {},
        data: {'message': 'success'},
      );

      expect(response.isSuccess, true);
      expect(response.isError, false);
    });

    test('NetworkResponse indicates error for 4xx status codes', () {
      const response = client.NetworkResponse(
        statusCode: 404,
        statusText: 'Not Found',
        headers: {},
      );

      expect(response.isSuccess, false);
      expect(response.isError, true);
    });

    test('NetworkError contains correct information', () {
      const error = client.NetworkError(
        message: 'Request failed',
        code: 'HTTP_ERROR',
        statusCode: 500,
      );

      expect(error.message, 'Request failed');
      expect(error.code, 'HTTP_ERROR');
      expect(error.statusCode, 500);
    });

    test('RetryConfig calculates delay correctly', () {
      const config = client.RetryConfig(
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
      const config = client.RetryConfig(
        maxAttempts: 3,
        retryableStatusCodes: [500, 502, 503],
        retryOnNetworkError: true,
      );

      // Should retry on retryable status code
      expect(
        config.shouldRetry(
          const client.NetworkError(message: 'Server error', statusCode: 500),
          0,
        ),
        true,
      );

      // Should not retry on non-retryable status code
      expect(
        config.shouldRetry(
          const client.NetworkError(message: 'Not found', statusCode: 404),
          0,
        ),
        false,
      );

      // Should retry on network error
      expect(
        config.shouldRetry(
          const client.NetworkError(message: 'Network error', code: 'NETWORK_ERROR'),
          0,
        ),
        true,
      );

      // Should not retry after max attempts
      expect(
        config.shouldRetry(
          const client.NetworkError(message: 'Server error', statusCode: 500),
          3,
        ),
        false,
      );
    });
  });

  group('NetworkManager', () {
    test('tracks request state correctly', () {
      final managerInstance = manager.NetworkManager(baseURL: 'https://api.example.com');

      expect(managerInstance.hasLoadingRequests, false);
      expect(managerInstance.requests.isEmpty, true);
    });

    test('identifies loading state for endpoint', () {
      final managerInstance = manager.NetworkManager(baseURL: 'https://api.example.com');

      expect(managerInstance.isEndpointLoading('test-endpoint'), false);
    });

    test('NetworkRequestInfo calculates duration', () {
      final startTime = DateTime.now();
      final endTime = startTime.add(const Duration(seconds: 2));

      final info = manager.NetworkRequestInfo(
        endpointId: 'test',
        requestId: 'req-1',
        state: manager.NetworkRequestState.success,
        startTime: startTime,
        endTime: endTime,
      );

      expect(info.duration, const Duration(seconds: 2));
    });

    test('NetworkRequestInfo copyWith creates new instance', () {
      const original = manager.NetworkRequestInfo(
        endpointId: 'test',
        requestId: 'req-1',
        state: manager.NetworkRequestState.loading,
      );

      final updated = original.copyWith(
        state: manager.NetworkRequestState.success,
      );

      expect(updated.state, manager.NetworkRequestState.success);
      expect(updated.endpointId, 'test');
      expect(updated.requestId, 'req-1');
    });
  });

  group('HttpMethod', () {
    test('has all standard HTTP methods', () {
      expect(client.HttpMethod.values.length, 7);
      expect(client.HttpMethod.values.contains(client.HttpMethod.get), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.post), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.put), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.patch), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.delete), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.head), true);
      expect(client.HttpMethod.values.contains(client.HttpMethod.options), true);
    });
  });

  group('NetworkRequestState', () {
    test('has all required states', () {
      expect(manager.NetworkRequestState.values.length, 5);
      expect(manager.NetworkRequestState.values.contains(manager.NetworkRequestState.idle), true);
      expect(manager.NetworkRequestState.values.contains(manager.NetworkRequestState.loading), true);
      expect(manager.NetworkRequestState.values.contains(manager.NetworkRequestState.success), true);
      expect(manager.NetworkRequestState.values.contains(manager.NetworkRequestState.error), true);
      expect(manager.NetworkRequestState.values.contains(manager.NetworkRequestState.cancelled), true);
    });
  });
}
