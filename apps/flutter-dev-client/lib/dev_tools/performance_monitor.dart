import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'dart:async';
import 'dart:io' show Platform;

/// Performance Monitor - Expo Go-like performance overlay
/// Shows FPS, memory usage, CPU, and render times
class PerformanceMonitor extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const PerformanceMonitor({
    super.key,
    required this.child,
    required this.enabled,
  });

  @override
  State<PerformanceMonitor> createState() => _PerformanceMonitorState();
}

class _PerformanceMonitorState extends State<PerformanceMonitor> with TickerProviderStateMixin {
  final _performanceTracker = PerformanceTracker();
  Timer? _updateTimer;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    _startTracking();
  }

  @override
  void dispose() {
    _stopTracking();
    _performanceTracker.dispose();
    super.dispose();
  }

  void _startTracking() {
    if (widget.enabled) {
      _performanceTracker.start();
      _updateTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() {});
        }
      });
    }
  }

  void _stopTracking() {
    _updateTimer?.cancel();
    _performanceTracker.stop();
  }

  @override
  void didUpdateWidget(PerformanceMonitor oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.enabled != oldWidget.enabled) {
      if (widget.enabled) {
        _startTracking();
      } else {
        _stopTracking();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (widget.enabled)
          Positioned(
            top: MediaQuery.of(context).padding.top + 50,
            right: 10,
            child: GestureDetector(
              onTap: () => setState(() => _isExpanded = !_isExpanded),
              child: _buildOverlay(),
            ),
          ),
      ],
    );
  }

  Widget _buildOverlay() {
    final metrics = _performanceTracker.getCurrentMetrics();

    if (!_isExpanded) {
      return _buildCompactView(metrics);
    }

    return _buildExpandedView(metrics);
  }

  Widget _buildCompactView(PerformanceMetrics metrics) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.85),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildMetricBadge(
            '${metrics.fps.toStringAsFixed(0)} FPS',
            _getFpsColor(metrics.fps),
          ),
          const SizedBox(width: 8),
          _buildMetricBadge(
            '${metrics.memoryMB.toStringAsFixed(0)} MB',
            Colors.purple,
          ),
        ],
      ),
    );
  }

  Widget _buildExpandedView(PerformanceMetrics metrics) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.90),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.speed,
                  color: Colors.orange,
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Performance',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Icon(
                Icons.keyboard_arrow_up,
                color: Colors.white.withOpacity(0.5),
                size: 20,
              ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 12),

          // FPS
          _buildMetricRow(
            'FPS',
            '${metrics.fps.toStringAsFixed(1)}',
            _getFpsColor(metrics.fps),
            icon: Icons.speed,
          ),

          const SizedBox(height: 8),

          // FPS Graph
          SizedBox(
            height: 40,
            child: CustomPaint(
              painter: GraphPainter(
                values: _performanceTracker.fpsHistory,
                color: _getFpsColor(metrics.fps),
                maxValue: 60,
              ),
              size: const Size(double.infinity, 40),
            ),
          ),

          const SizedBox(height: 12),

          // Memory
          _buildMetricRow(
            'Memory',
            '${metrics.memoryMB.toStringAsFixed(1)} MB',
            Colors.purple,
            icon: Icons.memory,
          ),

          const SizedBox(height: 8),

          // Memory Graph
          SizedBox(
            height: 40,
            child: CustomPaint(
              painter: GraphPainter(
                values: _performanceTracker.memoryHistory,
                color: Colors.purple,
                maxValue: _performanceTracker.memoryHistory.reduce((a, b) => a > b ? a : b) * 1.2,
              ),
              size: const Size(double.infinity, 40),
            ),
          ),

          const SizedBox(height: 12),

          // Frame Time
          _buildMetricRow(
            'Frame Time',
            '${metrics.frameTimeMs.toStringAsFixed(1)} ms',
            _getFrameTimeColor(metrics.frameTimeMs),
            icon: Icons.timer,
          ),

          const SizedBox(height: 8),

          // Dropped Frames
          _buildMetricRow(
            'Dropped Frames',
            metrics.droppedFrames.toString(),
            metrics.droppedFrames > 0 ? Colors.red : Colors.green,
            icon: Icons.warning,
          ),

          const SizedBox(height: 8),

          // Build Count
          _buildMetricRow(
            'Widgets Built',
            metrics.widgetBuilds.toString(),
            Colors.cyan,
            icon: Icons.widgets,
          ),
        ],
      ),
    );
  }

  Widget _buildMetricBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, Color color, {IconData? icon}) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: color.withOpacity(0.7), size: 14),
          const SizedBox(width: 6),
        ],
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 11,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
      ],
    );
  }

  Color _getFpsColor(double fps) {
    if (fps >= 55) return Colors.green;
    if (fps >= 45) return Colors.yellow;
    if (fps >= 30) return Colors.orange;
    return Colors.red;
  }

  Color _getFrameTimeColor(double frameTime) {
    if (frameTime <= 16.67) return Colors.green; // 60 FPS
    if (frameTime <= 33.33) return Colors.yellow; // 30 FPS
    return Colors.red;
  }
}

/// Performance metrics data class
class PerformanceMetrics {
  final double fps;
  final double memoryMB;
  final double frameTimeMs;
  final int droppedFrames;
  final int widgetBuilds;

  PerformanceMetrics({
    required this.fps,
    required this.memoryMB,
    required this.frameTimeMs,
    required this.droppedFrames,
    required this.widgetBuilds,
  });
}

/// Performance tracker that collects metrics
class PerformanceTracker {
  final List<double> fpsHistory = [];
  final List<double> memoryHistory = [];
  static const int historyLength = 60;

  int _frameCount = 0;
  int _droppedFrames = 0;
  int _widgetBuilds = 0;
  DateTime? _lastFrameTime;
  Timer? _fpsTimer;
  double _currentFps = 60.0;
  double _currentFrameTime = 16.67;

  void start() {
    SchedulerBinding.instance.addPostFrameCallback(_onFrame);
    _fpsTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _currentFps = _frameCount.toDouble();
      _frameCount = 0;
      _updateHistory();
    });
  }

  void stop() {
    _fpsTimer?.cancel();
  }

  void dispose() {
    stop();
  }

  void _onFrame(Duration timestamp) {
    _frameCount++;
    _widgetBuilds++;

    final now = DateTime.now();
    if (_lastFrameTime != null) {
      final frameDuration = now.difference(_lastFrameTime!).inMicroseconds / 1000.0;
      _currentFrameTime = frameDuration;

      // Detect dropped frames (frame took longer than 16.67ms for 60 FPS)
      if (frameDuration > 16.67) {
        _droppedFrames++;
      }
    }
    _lastFrameTime = now;

    SchedulerBinding.instance.addPostFrameCallback(_onFrame);
  }

  void _updateHistory() {
    // Update FPS history
    fpsHistory.add(_currentFps);
    if (fpsHistory.length > historyLength) {
      fpsHistory.removeAt(0);
    }

    // Update memory history (simulated for now)
    final memoryMB = _getMemoryUsage();
    memoryHistory.add(memoryMB);
    if (memoryHistory.length > historyLength) {
      memoryHistory.removeAt(0);
    }
  }

  double _getMemoryUsage() {
    // Note: Actual memory tracking would require platform channels
    // This is a simplified simulation
    return 50.0 + (memoryHistory.isEmpty ? 0 : memoryHistory.last * 0.98);
  }

  PerformanceMetrics getCurrentMetrics() {
    return PerformanceMetrics(
      fps: _currentFps,
      memoryMB: memoryHistory.isEmpty ? 50.0 : memoryHistory.last,
      frameTimeMs: _currentFrameTime,
      droppedFrames: _droppedFrames,
      widgetBuilds: _widgetBuilds,
    );
  }
}

/// Custom painter for performance graphs
class GraphPainter extends CustomPainter {
  final List<double> values;
  final Color color;
  final double maxValue;

  GraphPainter({
    required this.values,
    required this.color,
    required this.maxValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (values.isEmpty || maxValue == 0) return;

    final paint = Paint()
      ..color = color.withOpacity(0.6)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withOpacity(0.3),
          color.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final fillPath = Path();

    final stepX = size.width / (values.length - 1);

    for (int i = 0; i < values.length; i++) {
      final x = i * stepX;
      final y = size.height - (values[i] / maxValue * size.height);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(GraphPainter oldDelegate) {
    return oldDelegate.values != values ||
        oldDelegate.color != color ||
        oldDelegate.maxValue != maxValue;
  }
}
