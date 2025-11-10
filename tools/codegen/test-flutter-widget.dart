import 'package:flutter/material.dart';

/// A simple counter widget for testing Flutter-to-React conversion
class CounterWidget extends StatefulWidget {
  const CounterWidget({Key? key}) : super(key: key);

  @override
  State<CounterWidget> createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int counter = 0;
  String message = 'Hello Flutter';

  @override
  void initState() {
    super.initState();
    // Initialize counter
  }

  @override
  void dispose() {
    // Cleanup
    super.dispose();
  }

  void incrementCounter() {
    setState(() {
      counter = counter + 1;
    });
  }

  void resetCounter() {
    setState(() {
      counter = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.0),
      child: Column(
        children: [
          Text(
            message,
            style: TextStyle(
              fontSize: 24.0,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          Text(
            'Count: $counter',
            style: TextStyle(
              fontSize: 18.0,
            ),
          ),
          ElevatedButton(
            onPressed: incrementCounter,
            child: Text('Increment'),
          ),
          ElevatedButton(
            onPressed: resetCounter,
            child: Text('Reset'),
          ),
        ],
      ),
    );
  }
}
