# Design Document

## Overview

Lumora is a mobile-first development platform that bridges React/TSX authoring with native Flutter rendering. The system consists of three primary components: a Node.js Dev-Proxy server for session management and WebSocket brokering, a Flutter-Dev-Client mobile application for real-time UI rendering, and a Codegen-Tool for transforming TSX to JSON schemas and generating production Dart code.

The architecture follows a hub-and-spoke model where the Dev-Proxy acts as the central hub, coordinating communication between web-based editors and mobile device clients. This design enables instant preview of UI changes on actual devices while maintaining the flexibility to generate production-ready native code.

The framework supports two runtime modes:
1. **Fast Path**: JSON UI schemas are interpreted at runtime by the Flutter-Dev-Client for instant preview during development
2. **Native Path**: Schemas are transformed into production Dart code with proper state management patterns for deployment

## Architecture

### System Architecture Diagram

```
┌─────────────────────┐
│  React Web Editor   │
│  (Vite + Monaco)    │
└──────────┬──────────┘
           │ HTTP POST /send/:sessionId
           │ WebSocket /ws
           ▼
┌─────────────────────┐
│    Dev-Proxy        │
│  (Node.js Server)   │
│  - Session Mgmt     │
│  - QR Generation    │
│  - WS Broker        │
└──────────┬──────────┘
           │ WebSocket Broadcast
           │
           ▼
┌─────────────────────┐
│ Flutter-Dev-Client  │
│  (Mobile App)       │
│  - Schema Interp    │
│  - Widget Renderer  │
│  - Event Bridge     │
└─────────────────────┘

┌─────────────────────┐
│   Codegen Tool      │
│  (Node.js CLI)      │
│  - TSX Parser       │
│  - Schema Generator │
│  - Dart Generator   │
└─────────────────────┘
```

### Component Responsibilities

**Dev-Proxy (Node.js)**
- Manages ephemeral development sessions with unique IDs and tokens
- Generates QR codes containing connection information
- Brokers WebSocket connections between editors and devices
- Routes messages based on session isolation
- Handles ping/pong for connection health

**Flutter-Dev-Client (Dart/Flutter)**
- Establishes WebSocket connection to Dev-Proxy
- Interprets JSON UI schemas into Flutter widget trees
- Renders native widgets with platform-appropriate styling
- Sends UI events back through Event-Bridge
- Handles large payloads using Dart isolates

**Codegen-Tool (Node.js)**
- Parses TSX files using Babel AST walker
- Converts JSX elements to normalized JSON schemas
- Generates production Dart code from schemas
- Supports multiple state management adapters
- Provides watch mode for continuous regeneration


## Components and Interfaces

### Dev-Proxy Component

**Technology Stack**: Node.js, Express, ws (WebSocket library), qrcode-terminal

**API Endpoints**:
```javascript
GET /session/new
Response: {
  sessionId: string,
  token: string,
  wsUrl: string
}

POST /send/:sessionId
Body: WebSocketEnvelope
Response: { success: boolean, clientCount: number }
```

**WebSocket Protocol**:
```javascript
// Connection URL
ws://host:port/ws

// Join Message (client -> server)
{
  type: "join",
  payload: {
    sessionId: string,
    token: string,
    clientType: "device" | "editor"
  }
}

// Envelope Format
{
  type: "full_ui_schema" | "ui_schema_delta" | "dart_code_diff" | "event" | "ping" | "pong",
  meta: {
    sessionId: string,
    source: string,
    timestamp: number,
    version: string
  },
  payload: any
}
```

**Session Management**:
- Sessions stored in-memory Map with sessionId as key
- Each session contains: token, createdAt, expiresAt, connectedClients[]
- Session cleanup runs every 5 minutes to remove expired sessions
- Default session lifetime: 8 hours (configurable)

**QR Code Generation**:
- Uses qrcode-terminal to generate ASCII QR codes
- QR payload: JSON string containing { wsUrl, sessionId, token }
- Printed to console on session creation
- Also returned in HTTP response for programmatic access

### Flutter-Dev-Client Component

**Technology Stack**: Flutter 3.x, Dart 3.x, web_socket_channel package

**Core Classes**:

```dart
// WebSocket Manager
class DevProxyConnection {
  final String wsUrl;
  final String sessionId;
  final String token;
  
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  
  Future<void> connect();
  void disconnect();
  void sendMessage(Map<String, dynamic> envelope);
  Stream<Map<String, dynamic>> get messages;
}

// Schema Interpreter
class SchemaInterpreter {
  final RendererRegistry registry;
  
  Widget interpretSchema(Map<String, dynamic> schema);
  Widget _buildNode(Map<String, dynamic> node);
  void applyDelta(Map<String, dynamic> delta);
}

// Renderer Registry
class RendererRegistry {
  final Map<String, RendererFunction> _renderers;
  
  void register(String type, RendererFunction renderer);
  Widget? render(String type, Map<String, dynamic> props, List<Widget> children);
}

// Event Bridge
class EventBridge {
  final DevProxyConnection connection;
  
  void emitEvent(String action, Map<String, dynamic> payload);
  VoidCallback createHandler(String eventSpec);
}
```

**Widget Mapping**:
- View → Container with padding, margin, backgroundColor
- Text → Text with style, textAlign, overflow
- Button → ElevatedButton with onPressed callback
- List → ListView.builder for lazy rendering
- Image → Image.network with caching
- Input → TextField with controller and onChange

**Performance Optimizations**:
- Isolate-based parsing for schemas > 100KB
- Debouncing delta updates (300ms window)
- ListView.builder for lists > 20 items
- Widget key management for efficient rebuilds
- Cached network images


### Codegen-Tool Component

**Technology Stack**: Node.js, @babel/parser, @babel/traverse, Handlebars (for templates)

**CLI Interface**:
```bash
# TSX to Schema
kiro codegen tsx2schema <input.tsx> <output.json>
kiro codegen tsx2schema --watch <input.tsx> <output.json>

# Schema to Dart
kiro codegen schema2dart <schema.json> <output-dir> --adapter=bloc

# Create App
kiro create-app <app-name> --adapter=riverpod
```

**TSX Parser Architecture**:
```javascript
class TSXParser {
  parse(filePath) {
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const rootElement = this.findRootJSXElement(ast);
    return this.convertToSchema(rootElement);
  }
  
  convertToSchema(jsxElement) {
    return {
      type: jsxElement.name,
      props: this.extractProps(jsxElement.attributes),
      children: jsxElement.children.map(child => this.convertToSchema(child))
    };
  }
}
```

**Schema Structure**:
```json
{
  "schemaVersion": "1.0",
  "root": {
    "type": "View",
    "props": {
      "padding": 16,
      "backgroundColor": "#FFFFFF"
    },
    "children": [
      {
        "type": "Text",
        "props": {
          "text": "Hello World",
          "style": {
            "fontSize": 24,
            "fontWeight": "bold"
          }
        },
        "children": []
      }
    ]
  }
}
```

**Dart Code Generator**:
- Uses Handlebars templates for each state adapter
- Reads ui-mapping.json for widget and prop transformations
- Generates file structure based on Clean Architecture
- Creates domain, data, and presentation layers
- Includes state management boilerplate

**State Adapter Templates**:

*Bloc Template Structure*:
```
lib/
  features/
    feature_name/
      domain/
        entities/
        usecases/
      data/
        models/
        repositories/
      presentation/
        bloc/
          feature_event.dart
          feature_state.dart
          feature_bloc.dart
        pages/
          feature_page.dart
        widgets/
```

*Riverpod Template Structure*:
```
lib/
  features/
    feature_name/
      domain/
        entities/
        providers/
      data/
        models/
        repositories/
      presentation/
        providers/
          feature_provider.dart
        pages/
          feature_page.dart
        widgets/
```


## Data Models

### Session Model
```typescript
interface Session {
  sessionId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  connectedClients: Client[];
}

interface Client {
  clientId: string;
  clientType: 'device' | 'editor';
  connection: WebSocket;
  connectedAt: number;
}
```

### WebSocket Envelope Model
```typescript
interface WebSocketEnvelope {
  type: 'full_ui_schema' | 'ui_schema_delta' | 'dart_code_diff' | 'event' | 'ping' | 'pong';
  meta: {
    sessionId: string;
    source: string;
    timestamp: number;
    version: string;
  };
  payload: any;
}
```

### UI Schema Model
```typescript
interface UISchema {
  schemaVersion: string;
  root: SchemaNode;
}

interface SchemaNode {
  type: string;
  props: Record<string, any>;
  children: SchemaNode[];
}
```

### UI Mapping Model
```json
{
  "View": {
    "dart": "Container",
    "props": {
      "padding": "EdgeInsets.all",
      "margin": "EdgeInsets.all",
      "backgroundColor": "Color"
    }
  },
  "Text": {
    "dart": "Text",
    "props": {
      "text": "data",
      "style": "TextStyle"
    }
  },
  "Button": {
    "dart": "ElevatedButton",
    "props": {
      "title": "child",
      "onTap": "onPressed"
    }
  }
}
```

### Configuration Model
```typescript
interface KiroConfig {
  adapter: 'bloc' | 'riverpod' | 'provider' | 'getx';
  mappings: {
    customComponents?: Record<string, ComponentMapping>;
  };
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, TextStyle>;
    spacing: Record<string, number>;
  };
  codegen: {
    outputDir: string;
    cleanArchitecture: boolean;
    generateTests: boolean;
  };
}
```

### Event Model
```dart
class UIEvent {
  final String action;
  final Map<String, dynamic> payload;
  final String timestamp;
  final String sourceNodeId;
  
  UIEvent({
    required this.action,
    required this.payload,
    required this.timestamp,
    required this.sourceNodeId,
  });
  
  Map<String, dynamic> toJson() => {
    'action': action,
    'payload': payload,
    'timestamp': timestamp,
    'sourceNodeId': sourceNodeId,
  };
}
```


## Error Handling

### Dev-Proxy Error Handling

**Session Errors**:
- Invalid sessionId: Return 404 with error message
- Expired session: Return 410 Gone with expiration details
- Invalid token: Close WebSocket with code 4001 and reason "Invalid token"
- Session limit reached: Return 429 Too Many Requests

**WebSocket Errors**:
- Connection timeout: Close connection after 30 seconds without join message
- Malformed message: Log error, send error envelope back to sender
- Broadcast failure: Log error, continue with remaining clients
- Ping timeout: Close connection after 10 seconds without pong

**Error Response Format**:
```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID abc123 does not exist",
    "timestamp": 1699999999999
  }
}
```

### Flutter-Dev-Client Error Handling

**Connection Errors**:
- WebSocket connection failure: Show retry dialog with exponential backoff
- Authentication failure: Show QR scan screen to re-establish session
- Network timeout: Display offline indicator, queue messages for retry

**Schema Errors**:
- Invalid JSON: Display error overlay with JSON parsing details
- Unsupported schema version: Show warning, attempt best-effort rendering
- Missing required props: Use default values, log warning to console
- Unknown widget type: Render placeholder with type name, log warning

**Rendering Errors**:
- Widget build exception: Catch with ErrorWidget.builder, display error details
- Isolate parsing failure: Fall back to main thread parsing, show warning
- Template resolution failure: Render empty string, log missing variable

**Error UI Components**:
```dart
class ErrorOverlay extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback? onRetry;
  
  // Displays semi-transparent red overlay with error details
  // Includes "Retry" and "Dismiss" buttons
}

class SchemaErrorWidget extends StatelessWidget {
  final String nodeType;
  final String errorMessage;
  
  // Displays placeholder widget with error icon and details
  // Useful for debugging schema issues
}
```

### Codegen-Tool Error Handling

**Parse Errors**:
- Invalid TSX syntax: Display Babel parse error with line/column
- Missing default export: Error with suggestion to add export
- Unsupported JSX features: Warning with list of unsupported elements

**File System Errors**:
- Input file not found: Clear error message with file path
- Output directory not writable: Check permissions, suggest fix
- Watch mode file system errors: Log error, continue watching

**Generation Errors**:
- Template rendering failure: Display Handlebars error with context
- Invalid adapter choice: List available adapters, exit with code 1
- Missing mapping configuration: Use defaults, log warning

**Error Exit Codes**:
- 0: Success
- 1: Invalid arguments or configuration
- 2: Parse error
- 3: File system error
- 4: Generation error


## Testing Strategy

### Dev-Proxy Testing

**Unit Tests**:
- Session creation and token generation
- Session expiration and cleanup logic
- QR code payload generation
- Message routing to correct session clients
- Ping/pong timeout handling

**Integration Tests**:
- WebSocket connection and join flow
- Message broadcast to multiple clients
- Session isolation (messages don't leak between sessions)
- HTTP endpoint responses
- Concurrent session handling

**Test Tools**: Jest, ws (for WebSocket client simulation)

**Test Structure**:
```javascript
describe('Session Management', () => {
  test('creates unique session with token', () => {});
  test('expires session after configured lifetime', () => {});
  test('cleans up expired sessions', () => {});
});

describe('WebSocket Broker', () => {
  test('accepts valid join message', () => {});
  test('rejects invalid token', () => {});
  test('broadcasts to session clients only', () => {});
  test('handles client disconnection', () => {});
});
```

### Flutter-Dev-Client Testing

**Unit Tests**:
- Schema node parsing and validation
- Widget mapping for each primitive type
- Template placeholder resolution
- Event bridge message formatting
- Delta application logic

**Widget Tests**:
- Schema interpreter renders correct widgets
- Props are correctly applied to widgets
- Children are recursively rendered
- Error widgets display for invalid schemas
- Event handlers trigger correctly

**Integration Tests**:
- WebSocket connection establishment
- Full schema rendering end-to-end
- Delta updates modify existing UI
- Events sent back through WebSocket
- Isolate parsing for large schemas

**Test Tools**: flutter_test, mockito (for WebSocket mocking)

**Test Structure**:
```dart
group('SchemaInterpreter', () {
  test('parses valid schema', () {});
  test('renders View as Container', () {});
  test('renders Text with style', () {});
  test('handles unknown types gracefully', () {});
});

group('EventBridge', () {
  test('extracts action from emit spec', () {});
  test('sends event through WebSocket', () {});
  test('includes metadata in event', () {});
});
```

### Codegen-Tool Testing

**Unit Tests**:
- TSX parsing with various JSX structures
- Schema node generation
- Prop extraction and conversion
- Dart code template rendering
- File path generation for Clean Architecture

**Integration Tests**:
- End-to-end TSX to schema conversion
- End-to-end schema to Dart generation
- Watch mode file change detection
- Multi-adapter code generation
- Example app scaffolding

**Golden File Tests**:
- Compare generated schemas against golden files
- Compare generated Dart code against golden files
- Detect unintended changes in output

**Test Tools**: Jest, @babel/parser (for AST validation)

**Test Structure**:
```javascript
describe('TSX Parser', () => {
  test('parses simple View component', () => {});
  test('extracts props correctly', () => {});
  test('handles nested children', () => {});
  test('supports TypeScript types', () => {});
});

describe('Dart Generator', () => {
  test('generates Bloc structure', () => {});
  test('generates Riverpod structure', () => {});
  test('applies ui-mapping transformations', () => {});
  test('matches golden file output', () => {});
});
```

### End-to-End Testing

**Scenario 1: Quick Start Flow**
1. Start Dev-Proxy, create session
2. Launch Flutter-Dev-Client, scan QR
3. Generate schema from example TSX
4. Push schema to session
5. Verify UI renders on device within 2 seconds

**Scenario 2: Live Edit Flow**
1. Establish connection (as above)
2. Modify TSX file in watch mode
3. Schema auto-regenerates
4. Push delta to session
5. Verify UI updates without full reload

**Scenario 3: Production Code Generation**
1. Create example app with create-app command
2. Generate Dart code from schema with Bloc adapter
3. Build Flutter app with generated code
4. Verify app compiles and runs
5. Verify state management works correctly

**Performance Benchmarks**:
- Session creation: < 100ms
- Schema push latency: < 500ms (local network)
- Large schema (500KB) parsing: < 2s
- Delta application: < 100ms
- Code generation: < 5s for typical app


## Design Decisions and Rationales

### Why WebSocket over HTTP Polling?
WebSocket provides bidirectional, low-latency communication essential for real-time UI updates. HTTP polling would introduce unnecessary latency (typically 1-5 seconds) and increased server load. WebSocket enables sub-second update delivery and efficient event streaming from device to editor.

### Why JSON Schema Instead of Direct Dart Code Streaming?
JSON schemas provide a platform-agnostic intermediate representation that can be:
1. Interpreted at runtime for instant preview (fast path)
2. Transformed into production Dart code (native path)
3. Validated and versioned independently
4. Extended with custom types without changing the interpreter

Direct Dart code streaming would require runtime compilation (not feasible on mobile) or complex code injection mechanisms.

### Why Node.js for Dev-Proxy and Codegen?
Node.js provides:
- Excellent WebSocket library ecosystem (ws)
- Mature TSX/JSX parsing tools (@babel/parser)
- Fast startup time for CLI tools
- Cross-platform compatibility
- Large developer community familiar with JavaScript tooling

### Why Isolates for Large Schema Parsing?
Dart isolates prevent UI thread blocking when parsing large JSON payloads. Parsing 500KB+ JSON on the main thread can cause frame drops and perceived freezing. Isolates enable parallel processing while maintaining UI responsiveness.

### Why Multiple State Adapter Support?
Different project sizes and team preferences require different state management approaches:
- Small projects benefit from Provider's simplicity
- Medium projects need Bloc's structure and testability
- Large projects require Riverpod's modularity and performance
- Some teams prefer GetX's minimal boilerplate

Supporting multiple adapters makes the framework adaptable to real-world team needs.

### Why Clean Architecture for Generated Code?
Clean Architecture provides:
- Clear separation of concerns (domain, data, presentation)
- Testability through dependency inversion
- Maintainability as projects grow
- Industry-standard patterns familiar to Flutter developers
- Scalability for large applications

### Why Session-Based Architecture?
Sessions provide:
- Isolation between multiple concurrent developers
- Security through ephemeral tokens
- Automatic cleanup of stale connections
- Simple QR-based device pairing
- No persistent storage requirements

### Why Template Placeholders ({{ }})?
Template placeholders enable:
- Dynamic data injection without code changes
- Separation of UI structure from data
- Familiar syntax for developers (similar to Handlebars, Mustache)
- Safe variable resolution with fallback values
- Runtime flexibility without recompilation

### Why ui-mapping.json Configuration?
Externalizing widget mappings allows:
- Customization without modifying core code
- Team-specific widget preferences
- Easy addition of custom components
- Version control of mapping rules
- Documentation of transformation logic

### Why Debouncing Delta Updates?
Debouncing prevents:
- Excessive widget rebuilds during rapid typing
- Network congestion from frequent small updates
- Battery drain on mobile devices
- Choppy animation during updates

300ms debounce window balances responsiveness with efficiency.


## Security Considerations

### Session Token Security
- Tokens generated using cryptographically secure random bytes (32 bytes minimum)
- Tokens transmitted only over WebSocket (not in URLs or query params)
- Tokens valid only for single session lifetime (8 hours default)
- No token reuse across sessions
- Token validation on every WebSocket message

### WebSocket Security
- Origin validation to prevent CSRF attacks
- Rate limiting on message frequency (100 messages/second per client)
- Message size limits (10MB maximum payload)
- Connection limits per session (10 devices, 5 editors)
- Automatic disconnection on suspicious activity

### Code Injection Prevention
- Schema validation before interpretation
- Whitelist of allowed widget types
- Sanitization of string props to prevent XSS-like attacks
- No eval() or dynamic code execution in interpreter
- Template placeholder resolution uses safe variable lookup

### Network Security Recommendations
- Use TLS/WSS for production or remote development
- Firewall Dev-Proxy to local network only
- Warn users about code execution risks in dev-client
- Provide option to require device confirmation for schema updates

### Data Privacy
- No persistent storage of schemas or user data
- Sessions cleared from memory on expiration
- No logging of sensitive information
- No analytics or telemetry by default

## Performance Optimization Strategies

### Dev-Proxy Optimizations
- In-memory session storage (no database overhead)
- Connection pooling for WebSocket clients
- Message batching for multiple simultaneous updates
- Gzip compression for large payloads (optional)
- Efficient session cleanup with scheduled intervals

### Flutter-Dev-Client Optimizations
- Widget key management for efficient rebuilds
- Const constructors where possible
- Cached network images with memory limits
- ListView.builder for lazy list rendering
- RepaintBoundary for complex subtrees
- Isolate parsing for payloads > 100KB
- Delta updates instead of full schema replacement

### Codegen-Tool Optimizations
- Incremental parsing in watch mode (only changed files)
- Template caching to avoid repeated compilation
- Parallel file generation for multi-file output
- AST caching for repeated parsing operations
- Efficient file system operations (batch writes)

### Network Optimizations
- WebSocket message compression (permessage-deflate)
- Delta updates using JSON Patch format
- Debouncing rapid updates (300ms window)
- Message prioritization (events > deltas > full schemas)
- Connection keep-alive with efficient ping/pong

## Extensibility and Plugin Architecture

### Custom Renderer Registration
```dart
// Plugin registers custom renderer
class MapRenderer implements CustomRenderer {
  @override
  String get type => 'Map';
  
  @override
  Widget render(Map<String, dynamic> props, List<Widget> children) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(props['lat'], props['lng']),
        zoom: props['zoom'] ?? 12,
      ),
    );
  }
}

// Registration in app initialization
void main() {
  final registry = RendererRegistry();
  registry.register('Map', MapRenderer());
  
  runApp(KiroDevClient(registry: registry));
}
```

### Schema Transformation Hooks
```javascript
// Plugin can transform schema before emission
class CustomComponentPlugin {
  onBeforeSchemaEmit(schema) {
    // Transform custom components to primitives
    return this.transformCustomComponents(schema);
  }
  
  onAfterSchemaEmit(schema) {
    // Add metadata or validation
    return schema;
  }
}
```

### Adapter Extension Points
```javascript
// Custom adapter template
class CustomAdapter extends StateAdapter {
  getTemplateDir() {
    return path.join(__dirname, 'templates', 'custom');
  }
  
  getFileStructure() {
    return {
      'lib/state': ['state_manager.dart'],
      'lib/controllers': ['app_controller.dart'],
    };
  }
  
  transformProps(props) {
    // Custom prop transformations
    return props;
  }
}
```

### Plugin Manifest Format
```json
{
  "name": "kiro-plugin-maps",
  "version": "1.0.0",
  "compatibility": "^1.0.0",
  "renderers": [
    {
      "type": "Map",
      "class": "MapRenderer",
      "dependencies": ["google_maps_flutter"]
    }
  ],
  "hooks": {
    "onBeforeSchemaEmit": "./hooks/transform.js",
    "onAfterRender": "./hooks/postprocess.js"
  }
}
```

