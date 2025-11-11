import 'package:flutter/material.dart';

/// ErrorOverlay widget displays a semi-transparent error overlay
/// with error details and action buttons
class ErrorOverlay extends StatelessWidget {
  final String title;
  final String message;
  final String? stackTrace;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;

  const ErrorOverlay({
    super.key,
    required this.title,
    required this.message,
    this.stackTrace,
    this.onRetry,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.red.withOpacity(0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.white,
                size: 64,
              ),
              const SizedBox(height: 24),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                message,
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              if (stackTrace != null) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  constraints: const BoxConstraints(maxHeight: 200),
                  child: SingleChildScrollView(
                    child: Text(
                      stackTrace!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (onRetry != null) ...[
                    ElevatedButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],
                  if (onDismiss != null)
                    OutlinedButton.icon(
                      onPressed: onDismiss,
                      icon: const Icon(Icons.close),
                      label: const Text('Dismiss'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// SchemaErrorWidget displays a placeholder for schema rendering errors
/// Useful for debugging schema issues without crashing the app
class SchemaErrorWidget extends StatelessWidget {
  final String nodeType;
  final String errorMessage;
  final bool isWarning;

  const SchemaErrorWidget({
    super.key,
    required this.nodeType,
    required this.errorMessage,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isWarning ? Colors.orange : Colors.red;
    final backgroundColor = isWarning ? Colors.orange.shade50 : Colors.red.shade50;
    final icon = isWarning ? Icons.warning : Icons.error;

    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border.all(color: color, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: color,
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            isWarning ? 'Unknown Type' : 'Schema Error',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Type: $nodeType',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: color.shade700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            errorMessage,
            style: TextStyle(
              fontSize: 12,
              color: color.shade700,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// UpdateErrorOverlay displays an error overlay for update failures
/// Shows error details with options to retry or dismiss
class UpdateErrorOverlay extends StatelessWidget {
  final String errorMessage;
  final String? stackTrace;
  final VoidCallback? onRetry;
  final VoidCallback onDismiss;
  final Widget? previousWidget;

  const UpdateErrorOverlay({
    super.key,
    required this.errorMessage,
    this.stackTrace,
    this.onRetry,
    required this.onDismiss,
    this.previousWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Show previous widget in background if available
        if (previousWidget != null)
          Opacity(
            opacity: 0.3,
            child: previousWidget!,
          ),
        // Error overlay
        Container(
          color: Colors.black.withOpacity(0.85),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.redAccent,
                    size: 64,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Update Failed',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    errorMessage,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (stackTrace != null) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.redAccent.withOpacity(0.5)),
                      ),
                      constraints: const BoxConstraints(maxHeight: 200),
                      child: SingleChildScrollView(
                        child: Text(
                          stackTrace!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.white70,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (onRetry != null) ...[
                        ElevatedButton.icon(
                          onPressed: onRetry,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                      ],
                      OutlinedButton.icon(
                        onPressed: onDismiss,
                        icon: const Icon(Icons.close),
                        label: const Text('Dismiss'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'The previous UI state has been preserved',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.7),
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
