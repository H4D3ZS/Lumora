/// *
/// * Counter component with state management
import 'package:flutter/material.dart';
class Counter extends StatefulWidget {
  const Counter({Key? key}) : super(key: key);

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  String message = 'Click the button!';

  void handleIncrement() {
    setState(() {
      // TODO: Implement handleIncrement
    });
  }

  @override
  Widget build(BuildContext context) {
    return     Container(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            '$message',
            style: TextStyle(
              fontSize: 24,
            ),
          ),
          Text(
            'Current count: $count',
            style: TextStyle(
              fontSize: 18,
            ),
          ),
          ElevatedButton(
            onPressed: handleIncrement,
            child: Text('Increment'),
          ),
        ],
      ),
    );
  }
}
