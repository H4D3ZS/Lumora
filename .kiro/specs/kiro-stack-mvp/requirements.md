# Requirements Document

## Introduction

Lumora is a mobile-first Flutter development framework that enables developers to author UI in React+TypeScript/TSX and preview instantly on native Flutter clients via QR code and live synchronization. The system provides two runtime modes: a fast path using JSON UI schema interpretation for instant preview, and a native path using deterministic TSX to Dart codegen for production-quality Flutter code. The framework supports Clean Architecture principles and pluggable state management adapters (Bloc, Riverpod, Provider, GetX).

## Glossary

- **Dev-Proxy**: Node.js server that manages development sessions, generates QR codes, and brokers WebSocket connections between editors and Flutter clients
- **Flutter-Dev-Client**: Native Flutter application that connects to Dev-Proxy, receives JSON UI schemas, and renders them as native widgets in real-time
- **Codegen-Tool**: Command-line tool that converts React TSX files to JSON UI schemas and optionally generates Dart widget code
- **UI-Schema**: JSON representation of UI components with type, props, and children structure
- **Session**: Temporary development connection identified by sessionId and token, linking editor to device
- **State-Adapter**: Pluggable state management implementation (Bloc, Riverpod, Provider, or GetX)
- **Schema-Interpreter**: Component that converts JSON UI schema into Flutter widgets at runtime
- **Event-Bridge**: Mechanism for sending UI events from Flutter-Dev-Client back to Dev-Proxy and editor
- **WebSocket-Envelope**: Standardized message format with type, meta, and payload fields
- **Design-Token**: Reusable design values (colors, typography, spacing) mapped between platforms

## Requirements

### Requirement 1

**User Story:** As a Flutter developer, I want to start a development session with QR code generation, so that I can quickly connect my mobile device without manual configuration

#### Acceptance Criteria

1. WHEN the developer executes the session creation command, THE Dev-Proxy SHALL generate a unique sessionId and ephemeral token
2. WHEN the session is created, THE Dev-Proxy SHALL print an ASCII QR code to the terminal containing the WebSocket URL, sessionId, and token
3. WHEN the session is created, THE Dev-Proxy SHALL return a JSON response containing sessionId, token, and wsUrl fields
4. WHEN the session is created, THE Dev-Proxy SHALL set the session lifetime to 8 hours by default
5. WHILE the session is active, THE Dev-Proxy SHALL maintain the session state and accept connections

### Requirement 2

**User Story:** As a Flutter developer, I want the Flutter-Dev-Client to connect to the Dev-Proxy via WebSocket, so that I can receive real-time UI updates on my device

#### Acceptance Criteria

1. WHEN the Flutter-Dev-Client starts, THE Flutter-Dev-Client SHALL establish a WebSocket connection to the configured wsUrl
2. WHEN the connection is established, THE Flutter-Dev-Client SHALL send a join message containing sessionId, token, and clientType fields
3. IF the sessionId or token is invalid, THEN THE Dev-Proxy SHALL reject the connection with an error message
4. WHEN the join is successful, THE Dev-Proxy SHALL add the client to the session's connected clients list
5. WHILE the connection is active, THE Flutter-Dev-Client SHALL maintain the WebSocket connection and handle reconnection on failure

### Requirement 3

**User Story:** As a developer, I want to convert my TSX files to JSON UI schemas, so that I can preview my React components on the Flutter device

#### Acceptance Criteria

1. WHEN the developer executes the tsx2schema command with input and output paths, THE Codegen-Tool SHALL parse the TSX file using Babel parser
2. WHEN parsing the TSX file, THE Codegen-Tool SHALL locate the top-level JSX element in the default export or first JSXElement
3. WHEN converting JSX elements, THE Codegen-Tool SHALL map View, Text, Button, List, Image, and Input primitives to schema nodes
4. WHEN processing JSX props, THE Codegen-Tool SHALL convert string literals and object literals to JSON format
5. WHEN the conversion is complete, THE Codegen-Tool SHALL write the normalized JSON schema to the specified output file

### Requirement 4

**User Story:** As a developer, I want to push UI schemas to connected devices, so that I can see my changes instantly on the mobile device

#### Acceptance Criteria

1. WHEN the developer posts a schema to the send endpoint with a valid sessionId, THE Dev-Proxy SHALL validate the sessionId exists
2. WHEN the schema is received, THE Dev-Proxy SHALL wrap it in a WebSocket envelope with type full_ui_schema
3. WHEN the envelope is created, THE Dev-Proxy SHALL include meta fields containing sessionId, source, timestamp, and version
4. WHEN the envelope is ready, THE Dev-Proxy SHALL broadcast the message to all connected device clients in that session
5. WHEN the broadcast completes within 500 milliseconds, THE Dev-Proxy SHALL return a success response to the sender

### Requirement 5

**User Story:** As a Flutter developer, I want the Flutter-Dev-Client to interpret JSON schemas and render native widgets, so that I can see my UI designs as actual Flutter components

#### Acceptance Criteria

1. WHEN the Flutter-Dev-Client receives a full_ui_schema message, THE Schema-Interpreter SHALL parse the JSON payload
2. WHEN the schema root node is parsed, THE Schema-Interpreter SHALL validate the schemaVersion field is supported
3. WHEN processing schema nodes with type View, THE Schema-Interpreter SHALL render a Container widget
4. WHEN processing schema nodes with type Text, THE Schema-Interpreter SHALL render a Text widget with the text prop
5. WHEN processing schema nodes with type Button, THE Schema-Interpreter SHALL render an ElevatedButton widget with title and onTap props
6. WHEN processing schema nodes with type List, THE Schema-Interpreter SHALL render a ListView widget with children
7. WHEN the schema contains children arrays, THE Schema-Interpreter SHALL recursively process child nodes
8. IF the schema payload exceeds 100KB, THEN THE Schema-Interpreter SHALL parse the schema in a Dart isolate to avoid blocking the UI thread

### Requirement 6

**User Story:** As a developer, I want UI events from the Flutter device to be sent back to the editor, so that I can implement interactive behaviors

#### Acceptance Criteria

1. WHEN a user taps a button with onTap property containing emit:action:payload format, THE Event-Bridge SHALL extract the action and payload
2. WHEN the event is extracted, THE Event-Bridge SHALL create a WebSocket envelope with type event
3. WHEN the envelope is created, THE Event-Bridge SHALL include the action and meta fields in the payload
4. WHEN the envelope is ready, THE Event-Bridge SHALL send the message through the WebSocket connection to Dev-Proxy
5. WHEN Dev-Proxy receives the event, THE Dev-Proxy SHALL broadcast it to all connected editor clients in the session

### Requirement 7

**User Story:** As a Flutter developer, I want to receive incremental UI updates via deltas, so that large UI changes do not cause performance issues

#### Acceptance Criteria

1. WHEN the editor sends a ui_schema_delta message, THE Dev-Proxy SHALL broadcast it to connected device clients
2. WHEN the Flutter-Dev-Client receives a ui_schema_delta message, THE Schema-Interpreter SHALL apply the delta using JSON Patch or JSON Merge Patch format
3. WHEN applying the delta, THE Schema-Interpreter SHALL update only the changed portions of the UI tree
4. WHEN multiple deltas arrive within 300 milliseconds, THE Schema-Interpreter SHALL batch and debounce the updates
5. WHEN the delta is applied, THE Schema-Interpreter SHALL trigger a rebuild of only the affected widget subtree

### Requirement 8

**User Story:** As a Flutter developer, I want to use template placeholders in my schemas, so that I can inject dynamic values at runtime

#### Acceptance Criteria

1. WHEN the Schema-Interpreter encounters a string value containing {{ and }} delimiters, THE Schema-Interpreter SHALL identify it as a template placeholder
2. WHEN resolving a template placeholder, THE Schema-Interpreter SHALL extract the variable name between the delimiters
3. WHEN the variable name is extracted, THE Schema-Interpreter SHALL look up the value in the current render context
4. IF the variable is not found in the context, THEN THE Schema-Interpreter SHALL render an empty string or default value
5. WHEN the value is resolved, THE Schema-Interpreter SHALL replace the placeholder with the resolved value in the rendered widget

### Requirement 9

**User Story:** As a Flutter developer, I want the framework to support multiple state management adapters, so that I can choose the pattern that fits my project size and complexity

#### Acceptance Criteria

1. WHERE the project configuration specifies adapter as bloc, THE Codegen-Tool SHALL generate Bloc event, state, and bloc class files
2. WHERE the project configuration specifies adapter as riverpod, THE Codegen-Tool SHALL generate StateNotifier or Provider module files
3. WHERE the project configuration specifies adapter as provider, THE Codegen-Tool SHALL generate ChangeNotifier classes and ChangeNotifierProvider wiring
4. WHERE the project configuration specifies adapter as getx, THE Codegen-Tool SHALL generate controller classes and GetMaterialApp bindings
5. WHEN generating adapter code, THE Codegen-Tool SHALL follow Clean Architecture principles with separation of domain, data, and presentation layers

### Requirement 10

**User Story:** As a developer, I want the Dev-Proxy to handle WebSocket ping/pong messages, so that connections remain stable and detect disconnections

#### Acceptance Criteria

1. WHILE a WebSocket connection is active, THE Dev-Proxy SHALL send ping messages every 30 seconds
2. WHEN a ping message is sent, THE Dev-Proxy SHALL expect a pong response within 10 seconds
3. IF no pong response is received within 10 seconds, THEN THE Dev-Proxy SHALL close the connection and remove the client from the session
4. WHEN a client sends a ping message, THE Dev-Proxy SHALL respond with a pong message
5. WHEN a connection is closed, THE Dev-Proxy SHALL log the disconnection with sessionId and client type

### Requirement 11

**User Story:** As a Flutter developer, I want the Flutter-Dev-Client to handle large schemas efficiently, so that the app remains responsive during updates

#### Acceptance Criteria

1. WHEN the Flutter-Dev-Client receives a schema larger than 100KB, THE Flutter-Dev-Client SHALL parse the schema in a separate Dart isolate
2. WHEN parsing in an isolate, THE Flutter-Dev-Client SHALL communicate the parsed result back to the main thread via SendPort
3. WHEN rendering lists with more than 20 items, THE Schema-Interpreter SHALL use ListView.builder for lazy rendering
4. WHEN the schema parsing and rendering completes within 2 seconds, THE Flutter-Dev-Client SHALL display the UI to the user
5. WHILE parsing large schemas, THE Flutter-Dev-Client SHALL display a loading indicator to prevent perceived freezing

### Requirement 12

**User Story:** As a developer, I want to generate production Dart code from schemas, so that I can deploy native Flutter apps without runtime interpretation overhead

#### Acceptance Criteria

1. WHEN the developer executes the schema2dart command with a schema file and adapter choice, THE Codegen-Tool SHALL load the schema and adapter templates
2. WHEN generating Dart code, THE Codegen-Tool SHALL use the ui-mapping.json file to map schema types to Dart widget classes
3. WHEN mapping props, THE Codegen-Tool SHALL transform prop names according to the mapping rules (e.g., onTap to onPressed)
4. WHEN the adapter is bloc, THE Codegen-Tool SHALL generate event, state, and bloc files with BlocProvider and BlocBuilder usage
5. WHEN code generation is complete, THE Codegen-Tool SHALL write the generated Dart files to the specified output directory with proper file structure

### Requirement 13

**User Story:** As a Flutter developer, I want design tokens to be consistently applied across the framework, so that my UI maintains visual consistency

#### Acceptance Criteria

1. WHEN the Codegen-Tool generates Dart code, THE Codegen-Tool SHALL reference design token constants from kiro_ui_tokens package
2. WHEN the Schema-Interpreter renders widgets, THE Schema-Interpreter SHALL apply design tokens for colors, typography, and spacing
3. WHEN a schema specifies a color value, THE Schema-Interpreter SHALL map it to the corresponding design token constant
4. WHEN a schema specifies typography, THE Schema-Interpreter SHALL apply the TextStyle from design token definitions
5. WHEN a schema specifies spacing values, THE Schema-Interpreter SHALL use EdgeInsets constants from design tokens

### Requirement 14

**User Story:** As a developer, I want the Dev-Proxy to support multiple concurrent sessions, so that multiple developers can work simultaneously

#### Acceptance Criteria

1. WHEN multiple session creation requests are received, THE Dev-Proxy SHALL generate unique sessionIds for each request
2. WHEN clients connect to different sessions, THE Dev-Proxy SHALL isolate the WebSocket broadcasts to only clients within the same session
3. WHEN a schema is sent to a specific sessionId, THE Dev-Proxy SHALL broadcast only to clients connected to that session
4. WHEN a session expires after 8 hours, THE Dev-Proxy SHALL close all connections for that session and remove the session state
5. WHILE managing multiple sessions, THE Dev-Proxy SHALL maintain separate client lists and message queues for each session

### Requirement 15

**User Story:** As a Flutter developer, I want the Flutter-Dev-Client to provide error feedback when schema parsing fails, so that I can debug issues quickly

#### Acceptance Criteria

1. IF the Schema-Interpreter receives invalid JSON, THEN THE Flutter-Dev-Client SHALL display an error message with the JSON parsing error details
2. IF the schema contains an unsupported type value, THEN THE Schema-Interpreter SHALL log a warning and render a placeholder widget with the type name
3. IF a required prop is missing from a schema node, THEN THE Schema-Interpreter SHALL use a default value and log a warning
4. WHEN an error occurs during rendering, THE Flutter-Dev-Client SHALL display the error in a visible overlay without crashing the app
5. WHEN errors are logged, THE Flutter-Dev-Client SHALL include the schema node path and error message for debugging

### Requirement 16

**User Story:** As a developer, I want to create example applications using templates, so that I can quickly start new projects with best practices

#### Acceptance Criteria

1. WHEN the developer executes the create-app command with an app name, THE Codegen-Tool SHALL generate a project directory structure
2. WHEN creating the project, THE Codegen-Tool SHALL include example TSX files in the web/src directory
3. WHEN creating the project, THE Codegen-Tool SHALL include Flutter app structure in the mobile directory with pubspec.yaml
4. WHEN creating the project, THE Codegen-Tool SHALL include a kiro.config.json file with default adapter and mapping settings
5. WHEN the project is created within 30 seconds, THE Codegen-Tool SHALL output success message with next steps

### Requirement 17

**User Story:** As a Flutter developer, I want the framework to support custom renderer extensions, so that I can add platform-specific widgets beyond the core primitives

#### Acceptance Criteria

1. WHEN a developer registers a custom renderer, THE Schema-Interpreter SHALL add it to the RendererRegistry with a unique type name
2. WHEN the Schema-Interpreter encounters a schema node with a registered custom type, THE Schema-Interpreter SHALL invoke the custom renderer function
3. WHEN invoking the custom renderer, THE Schema-Interpreter SHALL pass the node props and children as parameters
4. WHEN the custom renderer returns a Widget, THE Schema-Interpreter SHALL include it in the widget tree
5. WHERE a plugin is installed, THE Schema-Interpreter SHALL automatically register renderers declared in the plugin manifest

### Requirement 18

**User Story:** As a developer, I want the Codegen-Tool to support watch mode, so that schemas are automatically regenerated when TSX files change

#### Acceptance Criteria

1. WHEN the developer executes codegen with the --watch flag, THE Codegen-Tool SHALL monitor the specified TSX file or directory for changes
2. WHEN a TSX file is modified, THE Codegen-Tool SHALL detect the change within 1 second
3. WHEN a change is detected, THE Codegen-Tool SHALL regenerate the schema file automatically
4. WHEN regeneration completes, THE Codegen-Tool SHALL log the output file path and timestamp
5. WHILE watch mode is active, THE Codegen-Tool SHALL continue monitoring until the process is terminated

### Requirement 19

**User Story:** As a Flutter developer, I want the Flutter-Dev-Client to work on both Android and iOS devices, so that I can test on multiple platforms

#### Acceptance Criteria

1. WHEN the Flutter-Dev-Client is built for Android with minSdkVersion 21, THE Flutter-Dev-Client SHALL compile without errors
2. WHEN the Flutter-Dev-Client is built for iOS with platform version 12.0, THE Flutter-Dev-Client SHALL compile without errors
3. WHEN running on Android emulator, THE Flutter-Dev-Client SHALL connect to Dev-Proxy using ws://10.0.2.2:3000/ws as default
4. WHEN running on physical devices, THE Flutter-Dev-Client SHALL connect using the machine's LAN IP address
5. WHEN the app runs on either platform, THE Schema-Interpreter SHALL render widgets with platform-appropriate styling

### Requirement 20

**User Story:** As a developer, I want comprehensive documentation and examples, so that I can quickly understand and use the framework

#### Acceptance Criteria

1. WHEN the repository is accessed, THE repository SHALL include a README.md with quickstart instructions requiring fewer than 5 commands
2. WHEN the repository is accessed, THE repository SHALL include example applications for todo-app and chat-app
3. WHEN the repository is accessed, THE repository SHALL include component-specific README files for dev-proxy, flutter-dev-client, and codegen
4. WHEN the repository is accessed, THE repository SHALL include a MOBILE_FIRST_GUIDE.md with iOS and Android build troubleshooting
5. WHEN the repository is accessed, THE repository SHALL include a SUBMISSION_CHECKLIST.md for hackathon submission preparation
