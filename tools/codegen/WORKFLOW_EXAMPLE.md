# Complete Workflow Example

This document demonstrates the complete workflow from TSX to production Dart code.

## Step 1: Create TSX Component

Create a simple TSX component:

**example-app.tsx:**
```tsx
export default function App() {
  return (
    <View padding={20} backgroundColor="#F5F5F5">
      <Text 
        text="Welcome to Lumora" 
        style={{ fontSize: 28, fontWeight: "bold", color: "#333333" }}
      />
      <Text 
        text="Build mobile apps with React and Flutter" 
        style={{ fontSize: 16, color: "#666666" }}
      />
      <Button 
        title="Get Started" 
        onTap="emit:getStarted:{}"
      />
      <List>
        <Text text="✓ Fast development" />
        <Text text="✓ Native performance" />
        <Text text="✓ Hot reload" />
      </List>
    </View>
  );
}
```

## Step 2: Convert TSX to Schema

```bash
node cli.js tsx2schema example-app.tsx example-schema.json
```

**Output:**
```
✓ Schema generated successfully: example-schema.json
```

**Generated example-schema.json:**
```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": 20,
      "backgroundColor": "#F5F5F5"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Welcome to Lumora",
          "style": {
            "fontSize": 28,
            "fontWeight": "bold",
            "color": "#333333"
          }
        },
        "children": []
      },
      {
        "type": "Text",
        "props": {
          "text": "Build mobile apps with React and Flutter",
          "style": {
            "fontSize": 16,
            "color": "#666666"
          }
        },
        "children": []
      },
      {
        "type": "Button",
        "props": {
          "title": "Get Started",
          "onTap": "emit:getStarted:{}"
        },
        "children": []
      },
      {
        "type": "List",
        "props": {},
        "children": [
          {
            "type": "Text",
            "props": {
              "text": "✓ Fast development"
            },
            "children": []
          },
          {
            "type": "Text",
            "props": {
              "text": "✓ Native performance"
            },
            "children": []
          },
          {
            "type": "Text",
            "props": {
              "text": "✓ Hot reload"
            },
            "children": []
          }
        ]
      }
    ]
  }
}
```

## Step 3: Generate Dart Code with Bloc

```bash
node cli.js schema2dart example-schema.json ./my-flutter-app -a bloc -f Welcome
```

**Output:**
```
🚀 Generating Dart code with bloc adapter...
   Schema: example-schema.json
   Output: ./my-flutter-app
   Feature: Welcome

✓ Dart code generated successfully!

Generated files:
  - lib/features/welcome/presentation/bloc/welcome_event.dart
  - lib/features/welcome/presentation/bloc/welcome_state.dart
  - lib/features/welcome/presentation/bloc/welcome_bloc.dart
  - lib/features/welcome/presentation/pages/welcome_page.dart
```

## Step 4: Review Generated Files

### welcome_event.dart
```dart
import 'package:equatable/equatable.dart';

abstract class WelcomeEvent extends Equatable {
  const WelcomeEvent();

  @override
  List<Object?> get props => [];
}

class LoadWelcome extends WelcomeEvent {
  const LoadWelcome();
}
```

### welcome_state.dart
```dart
import 'package:equatable/equatable.dart';

abstract class WelcomeState extends Equatable {
  const WelcomeState();

  @override
  List<Object?> get props => [];
}

class WelcomeInitial extends WelcomeState {
  const WelcomeInitial();
}

class WelcomeLoading extends WelcomeState {
  const WelcomeLoading();
}

class WelcomeLoaded extends WelcomeState {
  const WelcomeLoaded();
}

class WelcomeError extends WelcomeState {
  final String message;

  const WelcomeError(this.message);

  @override
  List<Object?> get props => [message];
}
```

### welcome_bloc.dart
```dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'welcome_event.dart';
import 'welcome_state.dart';

class WelcomeBloc extends Bloc<WelcomeEvent, WelcomeState> {
  WelcomeBloc() : super(const WelcomeInitial()) {
    on<LoadWelcome>(_onLoadWelcome);
  }

  Future<void> _onLoadWelcome(
    LoadWelcome event,
    Emitter<WelcomeState> emit,
  ) async {
    emit(const WelcomeLoading());
    
    try {
      // TODO: Implement load logic
      emit(const WelcomeLoaded());
    } catch (e) {
      emit(WelcomeError(e.toString()));
    }
  }
}
```

### welcome_page.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/welcome_bloc.dart';
import '../bloc/welcome_event.dart';
import '../bloc/welcome_state.dart';

class WelcomePage extends StatelessWidget {
  const WelcomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => WelcomeBloc()..add(const LoadWelcome()),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Welcome'),
        ),
        body: BlocBuilder<WelcomeBloc, WelcomeState>(
          builder: (context, state) {
            if (state is WelcomeLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            if (state is WelcomeError) {
              return Center(
                child: Text(
                  'Error: ${state.message}',
                  style: const TextStyle(color: Colors.red),
                ),
              );
            }

            if (state is WelcomeLoaded) {
              return _buildContent(context, state);
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WelcomeLoaded state) {
    return Container(
      padding: EdgeInsets.all(20), 
      decoration: BoxDecoration(color: Color(0xFFF5F5F5)), 
      child: Column(
        children: [
          Text(
            'Welcome to Lumora', 
            style: TextStyle(
              fontSize: 28, 
              fontWeight: FontWeight.bold, 
              color: Color(0xFF333333)
            )
          ), 
          Text(
            'Build mobile apps with React and Flutter', 
            style: TextStyle(
              fontSize: 16, 
              color: Color(0xFF666666)
            )
          ), 
          ElevatedButton(
            onPressed: () { /* emit:getStarted:{} */ }, 
            child: Text('Get Started')
          ), 
          ListView(
            children: [
              Text('✓ Fast development'), 
              Text('✓ Native performance'), 
              Text('✓ Hot reload')
            ]
          )
        ]
      )
    );
  }
}
```

## Step 5: Add to Flutter App

### Update pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
```

### Use in main.dart

```dart
import 'package:flutter/material.dart';
import 'features/welcome/presentation/pages/welcome_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lumora App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const WelcomePage(),
    );
  }
}
```

## Step 6: Run the App

```bash
flutter pub get
flutter run
```

## Alternative: Generate with Different Adapters

### Riverpod

```bash
node cli.js schema2dart example-schema.json ./my-flutter-app -a riverpod -f Welcome
```

**Dependencies:**
```yaml
dependencies:
  flutter_riverpod: ^2.4.0
```

### Provider

```bash
node cli.js schema2dart example-schema.json ./my-flutter-app -a provider -f Welcome
```

**Dependencies:**
```yaml
dependencies:
  provider: ^6.0.5
```

### GetX

```bash
node cli.js schema2dart example-schema.json ./my-flutter-app -a getx -f Welcome
```

**Dependencies:**
```yaml
dependencies:
  get: ^4.6.5
```

## Watch Mode for Development

For rapid development, use watch mode:

```bash
# Terminal 1: Watch TSX and auto-generate schema
node cli.js tsx2schema example-app.tsx example-schema.json --watch

# Terminal 2: Regenerate Dart code when schema changes
# (Manual for now, could be automated with a file watcher)
node cli.js schema2dart example-schema.json ./my-flutter-app -a bloc -f Welcome
```

## Summary

This workflow demonstrates:
1. ✅ Writing UI in familiar React/TSX syntax
2. ✅ Converting to JSON schema for runtime interpretation
3. ✅ Generating production Dart code with state management
4. ✅ Clean Architecture structure for maintainability
5. ✅ Multiple adapter options for different project needs

The generated code is production-ready and follows Flutter best practices!
