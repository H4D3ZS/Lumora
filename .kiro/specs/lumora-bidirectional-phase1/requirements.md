# Lumora Bidirectional Framework - Phase 1 Requirements

## Introduction

Lumora Bidirectional Framework enables developers to write in either React/TypeScript or Flutter/Dart, with automatic conversion between the two frameworks. Phase 1 focuses on building the core bidirectional conversion system, Lumora IR (Intermediate Representation), and the synchronization engine that makes real-time collaboration possible between React and Flutter developers.

## Glossary

- **Lumora-IR**: Framework-agnostic intermediate representation that captures UI structure, props, state, and behavior
- **React-to-Flutter-Transpiler**: Component that converts React/TypeScript code to Flutter/Dart code
- **Flutter-to-React-Transpiler**: Component that converts Flutter/Dart code to React/TypeScript code
- **Bidirectional-Sync-Engine**: System that watches both React and Flutter files and keeps them synchronized via Lumora IR
- **Conflict-Resolver**: UI and logic for handling cases where both React and Flutter versions are modified simultaneously
- **Widget-Mapping-Registry**: Configuration system that defines how widgets/components map between frameworks
- **Type-Mapper**: System that converts TypeScript types to Dart types and vice versa
- **State-Converter**: Component that translates state management patterns between React and Flutter
- **IR-Store**: Storage system for Lumora IR representations with versioning and history

## Requirements

### Requirement 1: Lumora IR Design and Implementation

**User Story:** As a framework architect, I want a universal intermediate representation for UI components, so that I can convert between any frameworks without direct coupling

#### Acceptance Criteria

1. WHEN a UI component is parsed from any framework, THE Lumora-IR SHALL represent it in a framework-agnostic JSON structure
2. WHEN the IR is created, THE Lumora-IR SHALL include type, props, children, state, events, and metadata fields
3. WHEN storing IR, THE IR-Store SHALL maintain version history with timestamps and source framework information
4. WHEN retrieving IR, THE IR-Store SHALL provide the latest version and allow querying historical versions
5. WHEN the IR schema changes, THE Lumora-IR SHALL support backward compatibility through version migration

### Requirement 2: React-to-Flutter Transpiler Enhancement

**User Story:** As a React developer, I want my React components to be automatically converted to Flutter widgets, so that I can build native mobile apps without learning Flutter

#### Acceptance Criteria

1. WHEN a React component is parsed, THE React-to-Flutter-Transpiler SHALL convert it to Lumora IR first
2. WHEN converting from IR to Flutter, THE React-to-Flutter-Transpiler SHALL generate idiomatic Dart code with proper formatting
3. WHEN handling React hooks, THE React-to-Flutter-Transpiler SHALL convert useState to StatefulWidget with setState
4. WHEN handling React Context, THE React-to-Flutter-Transpiler SHALL convert to InheritedWidget or Provider pattern
5. WHEN generating Flutter code, THE React-to-Flutter-Transpiler SHALL preserve comments and documentation from React source

### Requirement 3: Flutter-to-React Transpiler Implementation

**User Story:** As a Flutter developer, I want my Flutter widgets to be automatically converted to React components, so that I can build web apps without learning React

#### Acceptance Criteria

1. WHEN a Flutter widget is parsed, THE Flutter-to-React-Transpiler SHALL use Dart analyzer to build an AST
2. WHEN converting Flutter to IR, THE Flutter-to-React-Transpiler SHALL extract widget type, props, children, and state
3. WHEN converting from IR to React, THE Flutter-to-React-Transpiler SHALL generate TypeScript code with proper type annotations
4. WHEN handling StatefulWidget, THE Flutter-to-React-Transpiler SHALL convert to functional component with useState hook
5. WHEN handling InheritedWidget, THE Flutter-to-React-Transpiler SHALL convert to React Context API

### Requirement 4: Widget Mapping Registry

**User Story:** As a framework developer, I want a configurable mapping system between React and Flutter widgets, so that conversions are accurate and customizable

#### Acceptance Criteria

1. WHEN the system initializes, THE Widget-Mapping-Registry SHALL load mappings from widget-mappings.yaml configuration file
2. WHEN a widget is converted, THE Widget-Mapping-Registry SHALL provide the equivalent widget type in the target framework
3. WHEN props are converted, THE Widget-Mapping-Registry SHALL map prop names according to framework conventions
4. WHERE custom mappings are defined, THE Widget-Mapping-Registry SHALL use custom mappings over default mappings
5. WHEN a mapping is not found, THE Widget-Mapping-Registry SHALL log a warning and use a fallback generic mapping

### Requirement 5: Type System Conversion

**User Story:** As a developer, I want TypeScript types to be converted to Dart types and vice versa, so that type safety is maintained across frameworks

#### Acceptance Criteria

1. WHEN converting TypeScript to Dart, THE Type-Mapper SHALL convert string to String, number to double or int, boolean to bool
2. WHEN converting Dart to TypeScript, THE Type-Mapper SHALL convert String to string, int/double to number, bool to boolean
3. WHEN handling interfaces, THE Type-Mapper SHALL convert TypeScript interfaces to Dart classes with named constructors
4. WHEN handling generics, THE Type-Mapper SHALL preserve generic type parameters in both directions
5. WHEN handling nullable types, THE Type-Mapper SHALL convert TypeScript optional (?) to Dart nullable (?) and vice versa

### Requirement 6: Bidirectional Sync Engine

**User Story:** As a developer in a mixed team, I want changes in React files to automatically sync to Flutter files and vice versa, so that the codebase stays consistent

#### Acceptance Criteria

1. WHEN a React file is modified, THE Bidirectional-Sync-Engine SHALL detect the change within 1 second
2. WHEN a change is detected, THE Bidirectional-Sync-Engine SHALL convert the file to IR and then to the target framework
3. WHEN generating the target file, THE Bidirectional-Sync-Engine SHALL write it to the corresponding location in the target directory
4. WHEN both React and Flutter files are modified simultaneously, THE Bidirectional-Sync-Engine SHALL detect the conflict and invoke the Conflict-Resolver
5. WHILE sync is in progress, THE Bidirectional-Sync-Engine SHALL display a sync indicator in the CLI and web dashboard

### Requirement 7: Conflict Resolution System

**User Story:** As a developer, I want a clear way to resolve conflicts when both React and Flutter versions are modified, so that I don't lose work

#### Acceptance Criteria

1. WHEN a conflict is detected, THE Conflict-Resolver SHALL create a conflict record with both versions and timestamps
2. WHEN a conflict exists, THE Conflict-Resolver SHALL notify the developer via CLI, web dashboard, and VS Code extension
3. WHEN resolving a conflict, THE Conflict-Resolver SHALL provide options to use React version, use Flutter version, or manually merge
4. WHERE manual merge is selected, THE Conflict-Resolver SHALL present a diff view with both versions side by side
5. WHEN a conflict is resolved, THE Conflict-Resolver SHALL update the IR and regenerate both React and Flutter files

### Requirement 8: State Management Conversion

**User Story:** As a developer, I want state management patterns to be converted between React and Flutter, so that application logic is preserved

#### Acceptance Criteria

1. WHEN converting React useState to Flutter, THE State-Converter SHALL generate StatefulWidget with setState calls
2. WHEN converting Flutter StatefulWidget to React, THE State-Converter SHALL generate functional component with useState hooks
3. WHEN converting React useEffect to Flutter, THE State-Converter SHALL generate initState, didUpdateWidget, or dispose methods
4. WHEN converting Flutter lifecycle methods to React, THE State-Converter SHALL generate appropriate useEffect hooks
5. WHERE complex state management is used (Redux, Bloc), THE State-Converter SHALL preserve the pattern and generate equivalent code

### Requirement 9: Event Handler Conversion

**User Story:** As a developer, I want event handlers to be converted between React and Flutter, so that user interactions work correctly

#### Acceptance Criteria

1. WHEN converting React onPress to Flutter, THE transpiler SHALL generate onTap or onPressed callbacks
2. WHEN converting Flutter onTap to React, THE transpiler SHALL generate onPress or onClick handlers
3. WHEN handling event parameters, THE transpiler SHALL convert event object structures between frameworks
4. WHEN converting async event handlers, THE transpiler SHALL preserve async/await syntax in both directions
5. WHEN event handlers reference state, THE transpiler SHALL ensure state variables are correctly referenced in target framework

### Requirement 10: Styling Conversion

**User Story:** As a developer, I want styles to be converted between React and Flutter, so that UI appearance is consistent

#### Acceptance Criteria

1. WHEN converting React style objects to Flutter, THE transpiler SHALL generate BoxDecoration, TextStyle, or EdgeInsets as appropriate
2. WHEN converting Flutter styling to React, THE transpiler SHALL generate style objects with CSS-like properties
3. WHEN handling colors, THE transpiler SHALL convert hex colors (#RRGGBB) to Color objects and vice versa
4. WHEN handling dimensions, THE transpiler SHALL preserve numeric values and convert units where necessary
5. WHEN handling flexbox layouts, THE transpiler SHALL convert between React flexbox and Flutter Row/Column/Flex widgets

### Requirement 11: Navigation and Routing Conversion

**User Story:** As a developer, I want navigation logic to be converted between React and Flutter, so that app navigation works correctly

#### Acceptance Criteria

1. WHEN converting React Router to Flutter, THE transpiler SHALL generate Navigator with named routes
2. WHEN converting Flutter Navigator to React, THE transpiler SHALL generate React Router configuration
3. WHEN handling route parameters, THE transpiler SHALL preserve parameter passing in both directions
4. WHEN handling nested navigation, THE transpiler SHALL maintain navigation hierarchy in target framework
5. WHEN handling deep linking, THE transpiler SHALL generate equivalent deep link configuration in target framework

### Requirement 12: Asset and Resource Handling

**User Story:** As a developer, I want assets (images, fonts, etc.) to be accessible in both React and Flutter, so that resources are shared

#### Acceptance Criteria

1. WHEN an asset is referenced in React, THE system SHALL ensure the asset is available in Flutter's assets directory
2. WHEN an asset is referenced in Flutter, THE system SHALL ensure the asset is available in React's public directory
3. WHEN converting image references, THE transpiler SHALL update paths to match target framework conventions
4. WHEN handling fonts, THE system SHALL configure font families in both framework configurations
5. WHEN assets are added or removed, THE Bidirectional-Sync-Engine SHALL update both framework configurations

### Requirement 13: Development Mode Selection

**User Story:** As a developer, I want to choose whether to work in React-first, Flutter-first, or universal mode, so that I can optimize my workflow

#### Acceptance Criteria

1. WHEN initializing a project, THE Lumora CLI SHALL accept --mode flag with values react, flutter, or universal
2. WHERE mode is react, THE system SHALL treat React files as primary source and Flutter files as generated
3. WHERE mode is flutter, THE system SHALL treat Flutter files as primary source and React files as generated
4. WHERE mode is universal, THE system SHALL treat both React and Flutter files as primary sources and enable bidirectional sync
5. WHEN mode is set, THE system SHALL configure file watchers and sync behavior accordingly

### Requirement 14: CLI Commands for Conversion

**User Story:** As a developer, I want CLI commands to manually trigger conversions, so that I have control over the conversion process

#### Acceptance Criteria

1. WHEN executing lumora convert command with React file, THE CLI SHALL convert it to Flutter and display the output path
2. WHEN executing lumora convert command with Flutter file, THE CLI SHALL convert it to React and display the output path
3. WHEN using --dry-run flag, THE CLI SHALL show the conversion result without writing files
4. WHEN using --watch flag, THE CLI SHALL continuously watch for changes and auto-convert
5. WHEN conversion fails, THE CLI SHALL display clear error messages with line numbers and suggestions

### Requirement 15: IR Validation and Schema

**User Story:** As a framework developer, I want the IR to be validated against a schema, so that conversions are reliable

#### Acceptance Criteria

1. WHEN IR is generated, THE system SHALL validate it against the Lumora IR JSON schema
2. WHEN validation fails, THE system SHALL report specific schema violations with paths and expected types
3. WHEN IR version is incompatible, THE system SHALL attempt to migrate to the current version
4. WHERE migration is not possible, THE system SHALL report the incompatibility and suggest manual intervention
5. WHEN IR is stored, THE system SHALL include schema version in metadata for future compatibility checks

### Requirement 16: Performance Optimization

**User Story:** As a developer, I want conversions to be fast, so that my development workflow is not interrupted

#### Acceptance Criteria

1. WHEN converting a single component, THE system SHALL complete conversion within 500 milliseconds
2. WHEN converting a project with 100 components, THE system SHALL complete within 30 seconds
3. WHEN watching for changes, THE system SHALL detect file changes within 100 milliseconds
4. WHEN multiple files change simultaneously, THE system SHALL batch conversions and process in parallel
5. WHILE conversion is in progress, THE system SHALL show progress indicators for operations taking longer than 2 seconds

### Requirement 17: Error Handling and Recovery

**User Story:** As a developer, I want clear error messages when conversions fail, so that I can fix issues quickly

#### Acceptance Criteria

1. WHEN parsing fails, THE system SHALL display the file path, line number, and error description
2. WHEN conversion is not possible, THE system SHALL explain why and suggest alternatives
3. WHEN a widget has no mapping, THE system SHALL log a warning and use a generic fallback
4. WHERE partial conversion is possible, THE system SHALL complete the conversion and mark problematic sections with TODO comments
5. WHEN errors occur, THE system SHALL preserve the original files and not overwrite working code

### Requirement 18: Documentation Generation

**User Story:** As a developer, I want documentation to be preserved during conversion, so that code remains maintainable

#### Acceptance Criteria

1. WHEN converting React components with JSDoc comments, THE system SHALL convert them to Dart doc comments
2. WHEN converting Flutter widgets with dartdoc comments, THE system SHALL convert them to JSDoc comments
3. WHEN inline comments exist, THE system SHALL preserve them in the converted code
4. WHEN prop types are documented, THE system SHALL preserve type documentation in target framework
5. WHEN examples are included in documentation, THE system SHALL convert code examples to target framework syntax

### Requirement 19: Testing Support

**User Story:** As a developer, I want tests to be converted between frameworks, so that test coverage is maintained

#### Acceptance Criteria

1. WHEN converting React tests (Jest), THE system SHALL generate Flutter widget tests
2. WHEN converting Flutter widget tests, THE system SHALL generate React tests (Jest/React Testing Library)
3. WHEN test assertions are converted, THE system SHALL use equivalent matchers in target framework
4. WHEN mocks are used, THE system SHALL generate equivalent mocks in target framework
5. WHERE test conversion is not possible, THE system SHALL generate test stubs with TODO comments

### Requirement 20: Configuration and Customization

**User Story:** As a developer, I want to customize conversion behavior, so that generated code matches my project conventions

#### Acceptance Criteria

1. WHEN lumora.yaml exists, THE system SHALL load configuration for widget mappings, naming conventions, and formatting
2. WHERE custom widget mappings are defined, THE system SHALL use them instead of default mappings
3. WHERE naming conventions are specified, THE system SHALL apply them to generated file names and identifiers
4. WHERE formatting preferences are set, THE system SHALL format generated code accordingly
5. WHEN configuration is invalid, THE system SHALL report errors and fall back to defaults

