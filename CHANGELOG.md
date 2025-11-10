# Changelog

All notable changes to the Lumora project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Animation support in schema format
- Visual schema editor
- Plugin system for custom widgets
- Cloud-based sync for remote teams
- Advanced debugging tools

## [0.1.0-alpha.1] - TBD

### Added

#### Core Infrastructure
- Lumora IR (Intermediate Representation) system with JSON Schema validation
- IR storage system with versioning and history tracking
- IR migration system for schema updates
- Framework-agnostic component representation

#### Bidirectional Transpilation
- React/TSX to Flutter/Dart transpiler
- Flutter/Dart to React/TSX transpiler
- Babel-based React parser with AST traversal
- Dart analyzer integration for Flutter parsing
- Code generation with proper formatting (Prettier for React, dart_style for Flutter)

#### Widget Mapping
- Widget mapping registry with YAML configuration
- 50+ default widget mappings between React and Flutter
- Custom widget mapping support
- Fallback handling for unmapped widgets
- Prop name mapping between frameworks

#### Type System
- TypeScript to Dart type conversion
- Dart to TypeScript type conversion
- Interface/class conversion in both directions
- Generic type parameter preservation
- Nullable type handling

#### Sync Engine
- Real-time file watching with chokidar
- Change queue with batching and debouncing
- Bidirectional synchronization
- Conflict detection for simultaneous edits
- Sync status indicators

#### Conflict Resolution
- Automatic conflict detection
- Multiple resolution strategies (React, Flutter, manual merge)
- Interactive CLI conflict resolution
- Web dashboard diff view
- VS Code extension integration

#### State Management
- React useState ↔ Flutter StatefulWidget conversion
- React useEffect ↔ Flutter lifecycle methods conversion
- React Context ↔ Flutter InheritedWidget/Provider conversion
- Support for Redux, Bloc, Riverpod patterns
- State reference handling in event handlers

#### Event Handling
- Event handler mapping (onPress ↔ onTap/onPressed)
- Event parameter conversion
- Async/await preservation
- Callback state reference handling

#### Styling
- React style objects ↔ Flutter BoxDecoration/TextStyle conversion
- Color conversion (hex ↔ Color objects)
- Flexbox ↔ Row/Column/Flex conversion
- Dimension and unit handling
- Padding/margin conversion

#### Navigation
- React Router ↔ Flutter Navigator conversion
- Route parameter preservation
- Nested navigation support
- Deep linking configuration

#### Asset Management
- Automatic asset synchronization between frameworks
- Asset path conversion
- Framework configuration updates (pubspec.yaml, package.json)

#### Development Modes
- React-first mode (React as primary source)
- Flutter-first mode (Flutter as primary source)
- Universal mode (bidirectional sync)
- Mode configuration via CLI

#### Documentation
- JSDoc ↔ dartdoc conversion
- Inline comment preservation
- Code example conversion in documentation
- Documentation generation from source

#### Testing
- Jest tests ↔ Flutter widget tests conversion
- Test assertion conversion
- Mock conversion between frameworks
- Test stub generation for unconvertible tests

#### Configuration
- lumora.yaml configuration system
- Custom widget mappings
- Naming convention customization
- Code formatting preferences
- Schema validation

#### CLI Commands
- `lumora convert` - Convert files between frameworks
- `lumora init` - Initialize project with mode selection
- `--watch` flag for continuous conversion
- `--dry-run` flag for preview
- Error handling with clear messages

#### Performance
- Conversion caching for improved speed
- Parallel processing for multiple files
- Progress indicators for long operations
- Optimized file watching with debouncing
- Single component conversion < 500ms
- 100 component project < 30s

#### Error Handling
- Parse error handling with line numbers
- Conversion failure explanations
- Fallback for unmapped widgets
- Partial conversion support
- Original file preservation with backups

#### Documentation
- Architecture documentation
- API reference
- Getting started guide
- Conversion guide
- Configuration guide
- Troubleshooting guide
- Example projects (React-first, Flutter-first, Universal)

#### Testing
- 25+ unit test suites
- Integration tests for end-to-end conversion
- Performance benchmarks
- Widget mapping tests
- Conflict resolution tests
- Type conversion tests
- State management tests

### Changed
- N/A (first release)

### Deprecated
- N/A (first release)

### Removed
- N/A (first release)

### Fixed
- N/A (first release)

### Security
- Input validation for all user-provided data
- Schema validation to prevent malicious payloads
- File path sanitization
- Safe file operations with backups

## Package Versions

### NPM Packages
- `@lumora/ir@0.1.0-alpha.1` - Core IR system and conversion engine
- `@lumora/cli@0.1.0-alpha.1` - Command-line interface

### Pub.dev Packages
- `lumora_core@0.1.0-alpha.1` - Flutter core package
- `lumora_ui_tokens@0.1.0-alpha.1` - Design tokens

## Migration Guide

### From Pre-release to 0.1.0-alpha.1

This is the first release, no migration needed.

## Known Issues

### Alpha Release Limitations

1. **Widget Coverage**: Limited to core primitives. Custom widgets require manual mapping.
2. **Animation Support**: Not yet implemented. Planned for Phase 2.
3. **Complex State Patterns**: Basic support only. Advanced patterns may need manual adjustments.
4. **Test Conversion**: Basic implementation. Complex test scenarios may need manual intervention.
5. **Performance**: Large projects (500+ components) may experience slower conversion times.
6. **Error Recovery**: Some edge cases may not have graceful fallbacks.

### Reported Issues

No issues reported yet (first release).

## Contributors

- Lumora Team
- Kiro AI Hackathon 2025 participants

## Links

- [GitHub Repository](https://github.com/lumora/lumora)
- [NPM Package (@lumora/ir)](https://www.npmjs.com/package/@lumora/ir)
- [NPM Package (@lumora/cli)](https://www.npmjs.com/package/@lumora/cli)
- [Pub.dev Package (lumora_core)](https://pub.dev/packages/lumora_core)
- [Pub.dev Package (lumora_ui_tokens)](https://pub.dev/packages/lumora_ui_tokens)
- [Documentation](https://github.com/lumora/lumora#readme)
- [Issue Tracker](https://github.com/lumora/lumora/issues)

---

**Note**: This is an alpha release. APIs and features may change in future releases.
