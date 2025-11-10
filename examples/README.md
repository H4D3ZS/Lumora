# Lumora Framework Examples

This directory contains example applications demonstrating the Lumora framework's capabilities.

## Available Examples

### 1. Todo-App
A complete todo list application demonstrating:
- View, Text, Button, List, and Input primitives
- Event handling with emit:action:payload format
- Dynamic list rendering
- Bloc state management adapter
- Clean Architecture structure

**Location**: `examples/todo-app/`  
**Documentation**: [Todo-App README](todo-app/README.md)

### 2. Chat-App
A messaging application demonstrating:
- Complex layouts with message bubbles
- Sent/received message differentiation
- Multiple event types
- Riverpod state management adapter
- Clean Architecture structure

**Location**: `examples/chat-app/`  
**Documentation**: [Chat-App README](chat-app/README.md)

## Quick Start

### Run Todo-App Example

```bash
# 1. Generate schema from TSX
node tools/codegen/cli.js tsx2schema examples/todo-app/App.tsx examples/todo-app/schema.json

# 2. Start Dev-Proxy (in separate terminal)
cd tools/dev-proxy && npm start

# 3. Create session
curl -X POST http://localhost:3000/session/new

# 4. Run Flutter-Dev-Client (scan QR code)
cd apps/flutter-dev-client && flutter run

# 5. Push schema to device
curl -X POST http://localhost:3000/send/<SESSION_ID> \
  -H "Content-Type: application/json" \
  -d @examples/todo-app/schema.json
```

### Run Chat-App Example

```bash
# 1. Generate schema from TSX
node tools/codegen/cli.js tsx2schema examples/chat-app/App.tsx examples/chat-app/schema.json

# 2. Start Dev-Proxy (in separate terminal)
cd tools/dev-proxy && npm start

# 3. Create session
curl -X POST http://localhost:3000/session/new

# 4. Run Flutter-Dev-Client (scan QR code)
cd apps/flutter-dev-client && flutter run

# 5. Push schema to device
curl -X POST http://localhost:3000/send/<SESSION_ID> \
  -H "Content-Type: application/json" \
  -d @examples/chat-app/schema.json
```

## Verification Tests

### Run Automated Tests

```bash
# Run all verification tests
bash examples/run-verification-tests.sh
```

This will run 20 automated tests covering:
- Infrastructure (Node.js, Flutter)
- Schema validation
- Code generation
- Generated Dart code
- Documentation
- Component types
- Event handlers

### Test Results

Latest test results: [TEST_RESULTS.md](TEST_RESULTS.md)

**Summary**:
- Total Tests: 20
- Passed: 20
- Failed: 0
- Success Rate: 100%

## Generated Code

Both examples include pre-generated Dart code demonstrating production-ready implementations:

### Todo-App (Bloc Adapter)
```
examples/todo-app/generated/bloc/lib/features/todo/
├── domain/
│   ├── entities/
│   └── usecases/
├── data/
│   ├── models/
│   └── repositories/
└── presentation/
    ├── bloc/
    │   ├── todo_event.dart
    │   ├── todo_state.dart
    │   └── todo_bloc.dart
    ├── pages/
    │   └── todo_page.dart
    └── widgets/
```

### Chat-App (Riverpod Adapter)
```
examples/chat-app/generated/riverpod/lib/features/chat/
├── domain/
│   ├── entities/
│   └── usecases/
├── data/
│   ├── models/
│   └── repositories/
└── presentation/
    ├── providers/
    │   └── chat_provider.dart
    ├── pages/
    │   └── chat_page.dart
    └── widgets/
```

## Documentation

- [Todo-App README](todo-app/README.md) - Complete todo-app documentation
- [Chat-App README](chat-app/README.md) - Complete chat-app documentation
- [Verification Test Plan](VERIFICATION_TEST.md) - Detailed test plan
- [Verification Summary](EXAMPLES_VERIFICATION_SUMMARY.md) - Comprehensive verification summary
- [Test Results](TEST_RESULTS.md) - Latest test execution results

## Features Demonstrated

### UI Components
- **View**: Container layouts with padding, margins, and background colors
- **Text**: Typography with various styles, colors, and weights
- **Button**: Interactive buttons with event emission
- **List**: Dynamic list rendering with multiple items
- **Input**: Text input fields for user data entry

### Event Handling
- Button click events with `emit:action:payload` format
- Multiple event types (addTodo, completeTodo, sendMessage, etc.)
- Event payload passing for interactive behaviors

### State Management
- **Bloc**: Event-driven state management (todo-app)
- **Riverpod**: Reactive state management (chat-app)
- Clean Architecture with domain/data/presentation layers

### Styling
- Color schemes and backgrounds
- Typography and text styles
- Padding and margins
- Flexbox layouts
- Border radius and visual effects

### Code Generation
- TSX to JSON schema conversion
- Schema to Dart code generation
- Multiple state adapter support
- Clean Architecture structure

## Performance

### Schema Sizes
- Todo-App: 15,227 bytes
- Chat-App: 20,538 bytes

### Generation Speed
- TSX to Schema: < 1 second
- Schema to Dart: < 3 seconds

## Requirements

### Development
- Node.js (v14+)
- Flutter SDK (3.x)
- Dart SDK (3.x)

### Runtime
- Android: minSdkVersion 21+
- iOS: 12.0+
- Web: Modern browsers

## Troubleshooting

### Schema doesn't generate
- Ensure Node.js is installed
- Check that TSX file has valid syntax
- Verify default export exists in TSX file

### Generated code doesn't compile
- Run `flutter pub get` to install dependencies
- Check that kiro_ui_tokens package is available
- Verify Flutter SDK version is 3.x or higher

### Examples don't render on device
- Ensure Dev-Proxy is running
- Verify session is active (not expired)
- Check that Flutter-Dev-Client is connected
- Confirm schema was pushed successfully

## Next Steps

1. **Explore the Examples**: Review the TSX files and generated schemas
2. **Modify and Experiment**: Edit the TSX files and regenerate schemas
3. **Test on Device**: Run the examples on actual devices or emulators
4. **Create Your Own**: Use the examples as templates for your applications
5. **Read the Docs**: Check out the comprehensive documentation in each example

## Related Documentation

- [Framework Specification](../FRAMEWORK_SPEC.md)
- [State Management Guide](../STATE_MANAGEMENT.md)
- [Codegen Tool README](../tools/codegen/README.md)
- [Dev-Proxy README](../tools/dev-proxy/README.md)
- [Flutter-Dev-Client README](../apps/flutter-dev-client/README.md)
- [Mobile-First Guide](../MOBILE_FIRST_GUIDE.md)

## Contributing

Found an issue or want to improve the examples? Please see the main repository README for contribution guidelines.

## License

MIT License - See LICENSE file in the repository root.

---

**Examples Verified**: November 9, 2025  
**Status**: ✓ All tests passing  
**Framework Version**: 1.0
