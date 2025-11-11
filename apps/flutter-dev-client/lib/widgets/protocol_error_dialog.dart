import 'package:flutter/material.dart';

/// Types of protocol errors
enum ProtocolErrorType {
  connection,
  authentication,
  timeout,
  serverError,
  unknown,
}

/// Shows a dialog for protocol errors with appropriate actions
Future<ProtocolErrorAction?> showProtocolErrorDialog(
  BuildContext context, {
  required ProtocolErrorType errorType,
  required String errorMessage,
  String? errorCode,
  int? attemptNumber,
  int? nextRetrySeconds,
  bool canRetry = true,
}) {
  return showDialog<ProtocolErrorAction>(
    context: context,
    barrierDismissible: false,
    builder: (context) => ProtocolErrorDialog(
      errorType: errorType,
      errorMessage: errorMessage,
      errorCode: errorCode,
      attemptNumber: attemptNumber,
      nextRetrySeconds: nextRetrySeconds,
      canRetry: canRetry,
    ),
  );
}

/// Dialog widget for displaying protocol errors
class ProtocolErrorDialog extends StatelessWidget {
  final ProtocolErrorType errorType;
  final String errorMessage;
  final String? errorCode;
  final int? attemptNumber;
  final int? nextRetrySeconds;
  final bool canRetry;

  const ProtocolErrorDialog({
    super.key,
    required this.errorType,
    required this.errorMessage,
    this.errorCode,
    this.attemptNumber,
    this.nextRetrySeconds,
    this.canRetry = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AlertDialog(
      icon: Icon(
        _getErrorIcon(),
        color: _getErrorColor(theme),
        size: 48,
      ),
      title: Text(_getErrorTitle()),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            errorMessage,
            style: theme.textTheme.bodyMedium,
          ),
          if (errorCode != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Error Code: $errorCode',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontFamily: 'monospace',
                  color: theme.colorScheme.error,
                ),
              ),
            ),
          ],
          if (attemptNumber != null && attemptNumber! > 1) ...[
            const SizedBox(height: 12),
            Text(
              'Reconnection attempt: $attemptNumber',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          if (nextRetrySeconds != null && canRetry) ...[
            const SizedBox(height: 8),
            Text(
              'Next automatic retry in ${nextRetrySeconds}s',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Text(
            _getErrorSuggestion(),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
      actions: _buildActions(context),
    );
  }

  IconData _getErrorIcon() {
    switch (errorType) {
      case ProtocolErrorType.connection:
        return Icons.wifi_off;
      case ProtocolErrorType.authentication:
        return Icons.lock_outline;
      case ProtocolErrorType.timeout:
        return Icons.timer_off;
      case ProtocolErrorType.serverError:
        return Icons.error_outline;
      case ProtocolErrorType.unknown:
        return Icons.help_outline;
    }
  }

  Color _getErrorColor(ThemeData theme) {
    switch (errorType) {
      case ProtocolErrorType.authentication:
        return Colors.orange;
      case ProtocolErrorType.timeout:
        return Colors.amber;
      default:
        return theme.colorScheme.error;
    }
  }

  String _getErrorTitle() {
    switch (errorType) {
      case ProtocolErrorType.connection:
        return 'Connection Failed';
      case ProtocolErrorType.authentication:
        return 'Authentication Failed';
      case ProtocolErrorType.timeout:
        return 'Connection Timeout';
      case ProtocolErrorType.serverError:
        return 'Server Error';
      case ProtocolErrorType.unknown:
        return 'Error Occurred';
    }
  }

  String _getErrorSuggestion() {
    switch (errorType) {
      case ProtocolErrorType.connection:
        return '💡 Make sure your device and computer are on the same network.';
      case ProtocolErrorType.authentication:
        return '💡 Try scanning the QR code again to get a fresh session.';
      case ProtocolErrorType.timeout:
        return '💡 Check your network connection and try again.';
      case ProtocolErrorType.serverError:
        return '💡 The dev server may need to be restarted.';
      case ProtocolErrorType.unknown:
        return '💡 Try restarting the app and scanning the QR code again.';
    }
  }

  List<Widget> _buildActions(BuildContext context) {
    final actions = <Widget>[];

    // Always show dismiss button
    actions.add(
      TextButton(
        onPressed: () => Navigator.of(context).pop(ProtocolErrorAction.dismiss),
        child: const Text('Dismiss'),
      ),
    );

    // Show scan QR button for authentication errors
    if (errorType == ProtocolErrorType.authentication) {
      actions.add(
        FilledButton.icon(
          onPressed: () => Navigator.of(context).pop(ProtocolErrorAction.scanQR),
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Scan QR Code'),
        ),
      );
    }

    // Show retry button for retryable errors
    if (canRetry && errorType != ProtocolErrorType.authentication) {
      actions.add(
        FilledButton.icon(
          onPressed: () => Navigator.of(context).pop(ProtocolErrorAction.retry),
          icon: const Icon(Icons.refresh),
          label: const Text('Retry Now'),
        ),
      );
    }

    return actions;
  }
}

/// Actions that can be taken from the protocol error dialog
enum ProtocolErrorAction {
  dismiss,
  retry,
  scanQR,
}

/// Shows a timeout error dialog
Future<ProtocolErrorAction?> showTimeoutErrorDialog(
  BuildContext context, {
  required String errorMessage,
  int? attemptNumber,
}) {
  return showProtocolErrorDialog(
    context,
    errorType: ProtocolErrorType.timeout,
    errorMessage: errorMessage,
    attemptNumber: attemptNumber,
    canRetry: true,
  );
}

/// Shows an authentication error dialog
Future<ProtocolErrorAction?> showAuthenticationErrorDialog(
  BuildContext context, {
  required String errorMessage,
  String? errorCode,
}) {
  return showProtocolErrorDialog(
    context,
    errorType: ProtocolErrorType.authentication,
    errorMessage: errorMessage,
    errorCode: errorCode,
    canRetry: false,
  );
}

/// Shows a connection error dialog
Future<ProtocolErrorAction?> showConnectionErrorDialog(
  BuildContext context, {
  required String errorMessage,
  int? attemptNumber,
  int? nextRetrySeconds,
}) {
  return showProtocolErrorDialog(
    context,
    errorType: ProtocolErrorType.connection,
    errorMessage: errorMessage,
    attemptNumber: attemptNumber,
    nextRetrySeconds: nextRetrySeconds,
    canRetry: true,
  );
}

/// Shows a server error dialog
Future<ProtocolErrorAction?> showServerErrorDialog(
  BuildContext context, {
  required String errorMessage,
  String? errorCode,
}) {
  return showProtocolErrorDialog(
    context,
    errorType: ProtocolErrorType.serverError,
    errorMessage: errorMessage,
    errorCode: errorCode,
    canRetry: true,
  );
}
