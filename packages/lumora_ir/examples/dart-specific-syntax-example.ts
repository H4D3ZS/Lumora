/**
 * Example demonstrating Dart-specific syntax parsing
 * Shows named parameters, null safety, and custom widgets
 */

import { DartParser } from '../src/parsers/dart-parser';

// Example 1: Named Parameters
const namedParamsExample = `
class UserCard extends StatelessWidget {
  final String name;
  final int age;
  final String? email;
  final bool isActive;

  const UserCard({
    required this.name,
    required this.age,
    this.email,
    this.isActive = true,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(name),
          Text('Age: \$age'),
          if (email != null) Text(email!),
        ],
      ),
    );
  }
}
`;

// Example 2: Null Safety
const nullSafetyExample = `
class ProfileWidget extends StatefulWidget {
  @override
  _ProfileWidgetState createState() => _ProfileWidgetState();
}

class _ProfileWidgetState extends State<ProfileWidget> {
  String? username;
  int? userId;
  late String displayName;
  List<String>? tags;
  Map<String, dynamic>? metadata;

  @override
  void initState() {
    super.initState();
    displayName = username ?? 'Guest';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(displayName),
        Text(username?.toUpperCase() ?? 'N/A'),
        Text('User ID: \${userId ?? 0}'),
      ],
    );
  }
}
`;

// Example 3: Custom Widgets
const customWidgetsExample = `
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final Color? backgroundColor;
  final double elevation;

  const CustomButton({
    required this.label,
    required this.onPressed,
    this.backgroundColor,
    this.elevation = 2.0,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        elevation: elevation,
      ),
      child: Text(label),
    );
  }
}

class CustomCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? trailing;

  const CustomCard({
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: trailing,
      ),
    );
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CustomButton(
          label: 'Click Me',
          onPressed: () {},
          backgroundColor: Colors.blue,
        ),
        CustomCard(
          title: 'Hello',
          subtitle: 'World',
        ),
      ],
    );
  }
}
`;

// Run examples
function runExamples() {
  const parser = new DartParser();

  console.log('=== Example 1: Named Parameters ===\n');
  const ir1 = parser.parse(namedParamsExample, 'user_card.dart');
  console.log('Parsed widget:', ir1.nodes[0].type);
  console.log('Props with defaults:', ir1.nodes[0].props);
  console.log('');

  console.log('=== Example 2: Null Safety ===\n');
  const ir2 = parser.parse(nullSafetyExample, 'profile_widget.dart');
  const state = ir2.nodes[0].state;
  console.log('State variables:');
  state?.variables.forEach(v => {
    console.log(`  - ${v.name}: ${v.type}${v.initialValue ? ` = ${v.initialValue}` : ''}`);
  });
  console.log('');

  console.log('=== Example 3: Custom Widgets ===\n');
  const ir3 = parser.parse(customWidgetsExample, 'custom_widgets.dart');
  const registry = parser.getCustomWidgetRegistry();
  console.log('Custom widgets registered:');
  registry.getAll().forEach(w => {
    console.log(`  - ${w.name} (${w.type})`);
    console.log(`    Properties: ${w.properties.map(p => p.name).join(', ')}`);
  });
  console.log('');
  console.log('IR metadata custom widgets:', ir3.metadata.customWidgets?.length);
  console.log('');

  console.log('=== Custom Widget Builder Example ===\n');
  const builder = parser.extractCustomWidgetBuilder('CustomButton');
  if (builder) {
    console.log(builder);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export { runExamples };
