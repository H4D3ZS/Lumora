/// Loading state widgets for network operations
///
/// Provides various loading indicators and state management widgets
/// for displaying network request states in the UI.
library;

import 'package:flutter/material.dart';
import '../interpreter/network_manager.dart';

/// Simple circular loading indicator
class LoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;
  final String? message;

  const LoadingIndicator({
    super.key,
    this.size = 24.0,
    this.color,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              valueColor: color != null ? AlwaysStoppedAnimation<Color>(color!) : null,
              strokeWidth: 3.0,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

/// Full-screen loading overlay
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final String? message;
  final Color? backgroundColor;

  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
    this.message,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: backgroundColor ?? Colors.black.withOpacity(0.5),
            child: LoadingIndicator(
              size: 48.0,
              color: Colors.white,
              message: message,
            ),
          ),
      ],
    );
  }
}

/// Network request state builder widget
class NetworkStateBuilder<T> extends StatelessWidget {
  final NetworkManager networkManager;
  final String endpointId;
  final Widget Function(BuildContext context) onIdle;
  final Widget Function(BuildContext context) onLoading;
  final Widget Function(BuildContext context, T data) onSuccess;
  final Widget Function(BuildContext context, NetworkError error) onError;

  const NetworkStateBuilder({
    super.key,
    required this.networkManager,
    required this.endpointId,
    required this.onIdle,
    required this.onLoading,
    required this.onSuccess,
    required this.onError,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: networkManager,
      builder: (context, _) {
        final requests = networkManager.getRequestsForEndpoint(endpointId);

        if (requests.isEmpty) {
          return onIdle(context);
        }

        // Get the most recent request
        final latestRequest = requests.reduce(
          (a, b) => (a.startTime?.isAfter(b.startTime ?? DateTime(0)) ?? false) ? a : b,
        );

        switch (latestRequest.state) {
          case NetworkRequestState.loading:
            return onLoading(context);

          case NetworkRequestState.success:
            if (latestRequest.response?.data != null) {
              return onSuccess(context, latestRequest.response!.data as T);
            }
            return onIdle(context);

          case NetworkRequestState.error:
            if (latestRequest.error != null) {
              return onError(context, latestRequest.error!);
            }
            return onIdle(context);

          case NetworkRequestState.idle:
          case NetworkRequestState.cancelled:
            return onIdle(context);
        }
      },
    );
  }
}

/// Simple network state widget with default UI
class NetworkStateWidget<T> extends StatelessWidget {
  final NetworkManager networkManager;
  final String endpointId;
  final Widget Function(BuildContext context, T data) builder;
  final Widget? loadingWidget;
  final Widget? errorWidget;
  final Widget? idleWidget;
  final void Function(NetworkError error)? onError;

  const NetworkStateWidget({
    super.key,
    required this.networkManager,
    required this.endpointId,
    required this.builder,
    this.loadingWidget,
    this.errorWidget,
    this.idleWidget,
    this.onError,
  });

  @override
  Widget build(BuildContext context) {
    return NetworkStateBuilder<T>(
      networkManager: networkManager,
      endpointId: endpointId,
      onIdle: (context) => idleWidget ?? const SizedBox.shrink(),
      onLoading: (context) =>
          loadingWidget ?? const LoadingIndicator(message: 'Loading...'),
      onSuccess: (context, data) => builder(context, data),
      onError: (context, error) {
        onError?.call(error);
        return errorWidget ??
            ErrorDisplay(
              error: error,
              onRetry: () {
                // Retry logic would be implemented here
              },
            );
      },
    );
  }
}

/// Error display widget
class ErrorDisplay extends StatelessWidget {
  final NetworkError error;
  final VoidCallback? onRetry;
  final VoidCallback? onDismiss;

  const ErrorDisplay({
    super.key,
    required this.error,
    this.onRetry,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.error,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              error.message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (error.statusCode != null) ...[
              const SizedBox(height: 8),
              Text(
                'Status Code: ${error.statusCode}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (onRetry != null) ...[
                  ElevatedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                  if (onDismiss != null) const SizedBox(width: 12),
                ],
                if (onDismiss != null)
                  TextButton(
                    onPressed: onDismiss,
                    child: const Text('Dismiss'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Inline loading button that shows loading state
class LoadingButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final bool isLoading;
  final double? width;
  final double? height;

  const LoadingButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.isLoading = false,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : child,
      ),
    );
  }
}

/// Pull-to-refresh wrapper for network requests
class NetworkRefreshIndicator extends StatelessWidget {
  final NetworkManager networkManager;
  final String endpointId;
  final Future<void> Function() onRefresh;
  final Widget child;

  const NetworkRefreshIndicator({
    super.key,
    required this.networkManager,
    required this.endpointId,
    required this.onRefresh,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: child,
    );
  }
}

/// Network loading progress bar
class NetworkProgressBar extends StatelessWidget {
  final NetworkManager networkManager;
  final String? endpointId;
  final double height;

  const NetworkProgressBar({
    super.key,
    required this.networkManager,
    this.endpointId,
    this.height = 4.0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: networkManager,
      builder: (context, _) {
        final isLoading = endpointId != null
            ? networkManager.isEndpointLoading(endpointId!)
            : networkManager.hasLoadingRequests;

        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: isLoading ? height : 0,
          child: isLoading
              ? LinearProgressIndicator(
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).colorScheme.primary,
                  ),
                )
              : null,
        );
      },
    );
  }
}

/// Shimmer loading placeholder
class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerLoading({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Colors.grey[300]!,
                Colors.grey[100]!,
                Colors.grey[300]!,
              ],
              stops: [
                _animation.value - 0.3,
                _animation.value,
                _animation.value + 0.3,
              ].map((e) => e.clamp(0.0, 1.0)).toList(),
            ),
          ),
        );
      },
    );
  }
}

/// List shimmer loading placeholder
class ListShimmerLoading extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final EdgeInsets? padding;

  const ListShimmerLoading({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 80,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: padding,
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ShimmerLoading(
            width: double.infinity,
            height: itemHeight,
            borderRadius: BorderRadius.circular(8),
          ),
        );
      },
    );
  }
}
