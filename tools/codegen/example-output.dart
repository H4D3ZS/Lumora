/// *
/// * Example TSX component for demonstrating the tsx2schema CLI
/// *
/// * Usage:
/// *   node cli.js tsx2schema example.tsx example-output.json
/// *   node cli.js tsx2schema example.tsx example-output.json --watch
import 'package:flutter/material.dart';
class ExampleApp extends StatelessWidget {
  const ExampleApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return     Container(
      decoration: BoxDecoration(
        color: Color(0xFFF5F5F5),
      ),
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'Welcome to Lumora',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF333),
            ),
          ),
          Text(
            'A mobile-first Flutter development framework',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF666),
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            child: Text('Get Started'),
          ),
          ListView(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                ),
                padding: EdgeInsets.all(12),
                child: Text(
                  '✓ Instant preview on device',
                  style: TextStyle(
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                ),
                padding: EdgeInsets.all(12),
                child: Text(
                  '✓ Live hot reload',
                  style: TextStyle(
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: Color(0xFFFFFFFF),
                ),
                padding: EdgeInsets.all(12),
                child: Text(
                  '✓ Production-ready Dart code',
                  style: TextStyle(
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          TextField(
            decoration: InputDecoration(
              hintText: 'Enter your email',
            ),
          ),
        ],
      ),
    );
  }
}
