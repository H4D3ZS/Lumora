import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dev_client/interpreter/animation_manager.dart';

void main() {
  group('AnimationManager', () {
    late AnimationManager animationManager;

    setUp(() {
      animationManager = AnimationManager();
    });

    tearDown(() {
      animationManager.dispose();
    });

    testWidgets('creates timing animation controller', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              final controller = animationManager.createController(
                id: 'test-animation',
                vsync: tester,
                duration: 300,
              );

              expect(controller, isNotNull);
              expect(controller.duration, equals(const Duration(milliseconds: 300)));
              expect(animationManager.getState('test-animation'), equals(AnimationState.idle));

              return Container();
            },
          ),
        ),
      );
    });

    testWidgets('creates spring animation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              final controller = animationManager.createSpringAnimation(
                id: 'spring-animation',
                vsync: tester,
                begin: 0.0,
                end: 1.0,
                mass: 1.0,
                stiffness: 100.0,
                damping: 10.0,
              );

              expect(controller, isNotNull);
              expect(animationManager.getAnimation('spring-animation'), isNotNull);

              return Container();
            },
          ),
        ),
      );
    });

    testWidgets('creates tween animation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              final controller = animationManager.createController(
                id: 'tween-test',
                vsync: tester,
                duration: 300,
              );

              final animation = animationManager.createTween(
                id: 'tween-animation',
                controller: controller,
                begin: 0.0,
                end: 100.0,
                curve: Curves.easeInOut,
              );

              expect(animation, isNotNull);
              expect(animation.value, equals(0.0));

              return Container();
            },
          ),
        ),
      );
    });

    testWidgets('starts and stops animation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              animationManager.createController(
                id: 'control-test',
                vsync: tester,
                duration: 300,
              );

              // Start animation
              animationManager.start('control-test');
              expect(animationManager.getState('control-test'), equals(AnimationState.running));

              // Stop animation
              animationManager.stop('control-test');
              expect(animationManager.getState('control-test'), equals(AnimationState.paused));

              return Container();
            },
          ),
        ),
      );

      await tester.pump();
    });

    testWidgets('resets animation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              final controller = animationManager.createController(
                id: 'reset-test',
                vsync: tester,
                duration: 300,
              );

              controller.forward();
              animationManager.reset('reset-test');

              expect(controller.value, equals(0.0));
              expect(animationManager.getState('reset-test'), equals(AnimationState.idle));

              return Container();
            },
          ),
        ),
      );

      await tester.pump();
    });

    test('parses easing curves correctly', () {
      expect(animationManager.parseCurve('linear'), equals(Curves.linear));
      expect(animationManager.parseCurve('ease'), equals(Curves.ease));
      expect(animationManager.parseCurve('ease-in'), equals(Curves.easeIn));
      expect(animationManager.parseCurve('ease-out'), equals(Curves.easeOut));
      expect(animationManager.parseCurve('ease-in-out'), equals(Curves.easeInOut));
      expect(animationManager.parseCurve('bounce'), equals(Curves.bounceOut));
      expect(animationManager.parseCurve('elastic'), equals(Curves.elasticIn));
      expect(animationManager.parseCurve('unknown'), equals(Curves.linear)); // fallback
    });

    testWidgets('handles auto-start', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              animationManager.createController(
                id: 'auto-start-test',
                vsync: tester,
                duration: 300,
                autoStart: true,
              );

              return Container();
            },
          ),
        ),
      );

      await tester.pump();
      expect(animationManager.getState('auto-start-test'), equals(AnimationState.running));
    });

    testWidgets('handles delayed start', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              animationManager.createController(
                id: 'delay-test',
                vsync: tester,
                duration: 300,
                delay: 100,
                autoStart: true,
              );

              return Container();
            },
          ),
        ),
      );

      // Initially idle
      await tester.pump();
      expect(animationManager.getState('delay-test'), equals(AnimationState.idle));

      // After delay, should be running
      await tester.pump(const Duration(milliseconds: 150));
      expect(animationManager.getState('delay-test'), equals(AnimationState.running));
    });

    testWidgets('AnimatedWidgetBuilder renders with animation', (WidgetTester tester) async {
      final animationSchema = {
        'id': 'test-widget-animation-${DateTime.now().millisecondsSinceEpoch}',
        'type': 'timing',
        'duration': 300,
        'easing': 'ease-in-out',
        'properties': [
          {
            'name': 'opacity',
            'from': 0.0,
            'to': 1.0,
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: AnimatedWidgetBuilder(
            animationSchema: animationSchema,
            animationManager: animationManager,
            builder: (context, values) {
              final opacity = values['opacity'] ?? 0.0;
              return Opacity(
                opacity: opacity,
                child: Container(
                  width: 100,
                  height: 100,
                  color: Colors.blue,
                ),
              );
            },
          ),
        ),
      );

      // Initial state
      await tester.pump();
      
      // Animation should be running
      await tester.pump(const Duration(milliseconds: 150));
      
      // Complete animation
      await tester.pump(const Duration(milliseconds: 200));
      
      expect(find.byType(Opacity), findsOneWidget);
    });

    testWidgets('AnimatedWidgetBuilder handles spring animation', (WidgetTester tester) async {
      final animationSchema = {
        'id': 'spring-widget-animation-${DateTime.now().millisecondsSinceEpoch}',
        'type': 'spring',
        'springConfig': {
          'mass': 1.0,
          'stiffness': 100.0,
          'damping': 10.0,
        },
        'properties': [
          {
            'name': 'scale',
            'from': 0.0,
            'to': 1.0,
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: AnimatedWidgetBuilder(
            animationSchema: animationSchema,
            animationManager: animationManager,
            builder: (context, values) {
              final scale = values['scale'] ?? 0.0;
              return Transform.scale(
                scale: scale,
                child: Container(
                  width: 100,
                  height: 100,
                  color: Colors.red,
                ),
              );
            },
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      
      expect(find.byType(Transform), findsOneWidget);
    });

    testWidgets('AnimatedWidgetBuilder handles multiple properties', (WidgetTester tester) async {
      final animationSchema = {
        'id': 'multi-prop-animation-${DateTime.now().millisecondsSinceEpoch}',
        'type': 'timing',
        'duration': 300,
        'easing': 'linear',
        'properties': [
          {
            'name': 'opacity',
            'from': 0.0,
            'to': 1.0,
          },
          {
            'name': 'scale',
            'from': 0.5,
            'to': 1.0,
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: AnimatedWidgetBuilder(
            animationSchema: animationSchema,
            animationManager: animationManager,
            builder: (context, values) {
              final opacity = values['opacity'] ?? 0.0;
              final scale = values['scale'] ?? 0.5;
              
              return Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scale: scale,
                  child: Container(
                    width: 100,
                    height: 100,
                    color: Colors.green,
                  ),
                ),
              );
            },
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 150));
      
      expect(find.byType(Opacity), findsOneWidget);
      expect(find.byType(Transform), findsOneWidget);
    });

    testWidgets('AnimatedWidgetBuilder handles infinite iterations', (WidgetTester tester) async {
      final animationSchema = {
        'id': 'infinite-animation-${DateTime.now().millisecondsSinceEpoch}',
        'type': 'timing',
        'duration': 100,
        'easing': 'linear',
        'iterations': -1, // Infinite
        'properties': [
          {
            'name': 'rotation',
            'from': 0.0,
            'to': 6.28, // 2π radians
          },
        ],
      };

      await tester.pumpWidget(
        MaterialApp(
          home: AnimatedWidgetBuilder(
            animationSchema: animationSchema,
            animationManager: animationManager,
            builder: (context, values) {
              final rotation = values['rotation'] ?? 0.0;
              return Transform.rotate(
                angle: rotation,
                child: Container(
                  width: 100,
                  height: 100,
                  color: Colors.purple,
                ),
              );
            },
          ),
        ),
      );

      await tester.pump();
      
      // Animation should repeat
      await tester.pump(const Duration(milliseconds: 150));
      await tester.pump(const Duration(milliseconds: 150));
      
      expect(find.byType(Transform), findsOneWidget);
    });
  });
}
