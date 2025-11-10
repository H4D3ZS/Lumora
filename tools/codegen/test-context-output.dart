/// *
/// * Component using context
import 'package:flutter/material.dart';
class ThemeInheritedWidget extends InheritedWidget {
  const ThemeInheritedWidget({
    Key? key,
    required this.data,
    required Widget child,
  }) : super(key: key, child: child);

  final Map<String, dynamic> data;

  static ThemeInheritedWidget? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ThemeInheritedWidget>();
  }

  @override
  bool updateShouldNotify(ThemeInheritedWidget oldWidget) {
    return data != oldWidget.data;
  }
}


class ThemedButton extends StatefulWidget {
  const ThemedButton({Key? key}) : super(key: key);

  @override
  State<ThemedButton> createState() => _ThemedButtonState();
}

class _ThemedButtonState extends State<ThemedButton> {
  String theme = 'light';

  void toggleTheme() {
    setState(() {
      // TODO: Implement toggleTheme
    });
  }

  @override
  Widget build(BuildContext context) {
    return     Container(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'Current theme: $theme',
            style: TextStyle(
              fontSize: 18,
            ),
          ),
          ElevatedButton(
            onPressed: toggleTheme,
            child: Text('Toggle Theme'),
          ),
        ],
      ),
    );
  }
}
