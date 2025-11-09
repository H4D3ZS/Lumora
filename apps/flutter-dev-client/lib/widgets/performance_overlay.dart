import 'package:flutter/material.dart';
import '../interpreter/schema_interpreter.dart';

/// Performance overlay widget that displays performance metrics in debug mode
class PerformanceOverlay extends StatelessWidget {
  final List<PerformanceMetric> metrics;
  final VoidCallback? onDismiss;

  const PerformanceOverlay({
    Key? key,
    required this.metrics,
    this.onDismiss,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (metrics.isEmpty) {
      return const SizedBox.shrink();
    }

    // Calculate average metrics
    final avgTotal = metrics.map((m) => m.totalDurationMs).reduce((a, b) => a + b) / metrics.length;
    final avgParsing = metrics.map((m) => m.parsingDurationMs).reduce((a, b) => a + b) / metrics.length;
    
    final latestMetric = metrics.last;

    return Positioned(
      top: 50,
      right: 10,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(8),
        color: Colors.black.withOpacity(0.85),
        child: Container(
          padding: const EdgeInsets.all(12),
          constraints: const BoxConstraints(maxWidth: 300),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Performance Metrics',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  if (onDismiss != null)
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: onDismiss,
                    ),
                ],
              ),
              const SizedBox(height: 8),
              const Divider(color: Colors.white24, height: 1),
              const SizedBox(height: 8),
              _buildMetricRow(
                'Latest Total',
                '${latestMetric.totalDurationSeconds.toStringAsFixed(3)}s',
                _getColorForDuration(latestMetric.totalDurationMs),
              ),
              _buildMetricRow(
                'Latest Parsing',
                '${latestMetric.parsingDurationSeconds.toStringAsFixed(3)}s',
                Colors.white70,
              ),
              if (latestMetric.widgetBuildDurationMs != null)
                _buildMetricRow(
                  'Latest Widget Build',
                  '${latestMetric.widgetBuildDurationSeconds!.toStringAsFixed(3)}s',
                  Colors.white70,
                ),
              const SizedBox(height: 8),
              const Divider(color: Colors.white24, height: 1),
              const SizedBox(height: 8),
              _buildMetricRow(
                'Avg Total (${metrics.length})',
                '${(avgTotal / 1000.0).toStringAsFixed(3)}s',
                Colors.white70,
              ),
              _buildMetricRow(
                'Avg Parsing',
                '${(avgParsing / 1000.0).toStringAsFixed(3)}s',
                Colors.white70,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),
          const SizedBox(width: 16),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForDuration(int durationMs) {
    if (durationMs > 2000) {
      return Colors.red;
    } else if (durationMs > 1000) {
      return Colors.orange;
    } else if (durationMs > 500) {
      return Colors.yellow;
    } else {
      return Colors.green;
    }
  }
}
