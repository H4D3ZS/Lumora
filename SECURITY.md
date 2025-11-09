# Security Features

This document describes the security measures implemented in the Lumora framework to protect against common vulnerabilities and attacks.

## Overview

Lumora implements multiple layers of security across its components:
- **Dev-Proxy**: Token-based authentication, rate limiting, connection limits, origin validation
- **Flutter-Dev-Client**: Schema validation, input sanitization, widget type whitelisting
- **WebSocket Communication**: Secure message handling, size limits, health checks

## Token Security (Dev-Proxy)

### Token Generation
- **Algorithm**: Cryptographically secure random bytes using Node.js `crypto.randomBytes()`
- **Size**: 32 bytes (256 bits) providing strong security
- **Format**: Hexadecimal string (64 characters)
- **Lifetime**: Tokens are ephemeral and expire with session lifetime (8 hours default)

### Token Protection
- ✅ Tokens are **never logged** to console or files
- ✅ Tokens are **never exposed in URLs** or query parameters
- ✅ Tokens are only transmitted in WebSocket message payloads
- ✅ Tokens are validated on **every WebSocket message** after initial join
- ✅ Sessions are automatically cleaned up on expiration

### Implementation
```typescript
// Token generation (session-manager.ts)
private generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Token validation on every message (websocket-broker.ts)
const validation = this.sessionManager.validateSession(ws.sessionId);
if (!validation.valid) {
  ws.close(4001, 'Session expired or not found');
  return;
}
```

## WebSocket Security (Dev-Proxy)

### Origin Validation (CSRF Protection)
- **Purpose**: Prevents Cross-Site Request Forgery attacks
- **Implementation**: Validates `Origin` header on WebSocket connections
- **Allowed Origins**: Localhost and local network IPs (development mode)
- **Action**: Rejects connections from unauthorized origins with code 1008

```typescript
// Origin validation patterns
const allowedPatterns = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
];
```

### Rate Limiting
- **Limit**: 100 messages per second per client
- **Window**: 1 second rolling window
- **Action**: Closes connection with code 1008 if limit exceeded
- **Tracking**: Per-client message counter with automatic reset

```typescript
// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second
const RATE_LIMIT_MAX_MESSAGES = 100; // 100 messages/second
```

### Message Size Limits
- **Maximum Size**: 10MB per message
- **Enforcement**: Both at WebSocket server level and message handler level
- **Action**: Closes connection with code 1009 if message too large
- **Purpose**: Prevents memory exhaustion attacks

```typescript
// WebSocket server configuration
this.wss = new WebSocketServer({ 
  maxPayload: MAX_MESSAGE_SIZE // 10MB
});
```

### Connection Limits Per Session
- **Maximum Devices**: 10 per session
- **Maximum Editors**: 5 per session
- **Action**: Rejects new connections with code 1008 if limit reached
- **Purpose**: Prevents resource exhaustion

```typescript
// Connection limits
const MAX_DEVICES_PER_SESSION = 10;
const MAX_EDITORS_PER_SESSION = 5;
```

### Suspicious Activity Detection
- **Parse Errors**: Connection closed on malformed JSON
- **Invalid Messages**: Connection closed on protocol violations
- **Unauthenticated Access**: Connection closed if messages sent before join
- **Session Validation**: Continuous validation of session state

## Schema Validation Security (Flutter-Dev-Client)

### Widget Type Whitelisting
- **Purpose**: Prevents execution of arbitrary or malicious widget types
- **Whitelist**: Only core primitives allowed by default
- **Allowed Types**: View, Text, Button, List, Image, Input
- **Custom Types**: Only allowed if registered via RendererRegistry
- **Action**: Renders error widget for non-whitelisted types

```dart
// Whitelist definition
static const Set<String> allowedWidgetTypes = {
  'View', 'Text', 'Button', 'List', 'Image', 'Input',
};
```

### Input Sanitization
- **String Sanitization**: Removes dangerous patterns from all string props
- **Script Tags**: Removes `<script>` tags (case-insensitive)
- **JavaScript Protocol**: Removes `javascript:` protocol from URLs
- **Data URLs**: Removes data URLs containing scripts
- **Recursive**: Sanitizes nested maps and lists

```dart
// Sanitization patterns
sanitized = sanitized.replaceAll(RegExp(r'<script[^>]*>.*?</script>', caseSensitive: false), '');
sanitized = sanitized.replaceAll(RegExp(r'javascript:', caseSensitive: false), '');
```

### Dangerous Prop Blocking
- **Blocked Props**: Props containing 'script', 'eval', or 'function' in name
- **Action**: Props are silently dropped with warning logged
- **Purpose**: Prevents injection of executable code through prop names

```dart
// Dangerous prop detection
if (key.toLowerCase().contains('script') || 
    key.toLowerCase().contains('eval') ||
    key.toLowerCase().contains('function')) {
  // Blocked
}
```

### Schema Structure Validation
- **Required Fields**: Validates presence of `schemaVersion` and `root`
- **Type Validation**: Ensures root is a valid object
- **Version Check**: Warns on unsupported schema versions
- **Action**: Displays error overlay for invalid schemas

### No Dynamic Code Execution
- ✅ **No eval()**: Template engine uses only variable lookup
- ✅ **No Function()**: No dynamic function creation
- ✅ **No code generation**: All widgets are statically defined
- ✅ **Safe templates**: Placeholders resolved via map lookup only

```dart
// Safe template resolution (template_engine.dart)
final variableValue = context.get(variableName);
return variableValue?.toString() ?? '';
```

## Security Best Practices

### For Developers Using Lumora

1. **Development Environment**
   - Use Lumora only on trusted local networks
   - Don't expose Dev-Proxy to the internet without TLS/WSS
   - Keep session tokens confidential

2. **Production Deployment**
   - Use generated Dart code, not runtime interpretation
   - Implement additional authentication if needed
   - Review generated code for security issues

3. **Custom Renderers**
   - Validate all props in custom renderers
   - Don't execute user-provided code
   - Follow Flutter security best practices

4. **Schema Design**
   - Don't include sensitive data in schemas
   - Validate data on the backend, not just client
   - Use template variables for dynamic content

### For Framework Contributors

1. **Code Review**
   - Review all security-related changes carefully
   - Test security features with malicious inputs
   - Document security implications

2. **Testing**
   - Write security tests for new features
   - Test with fuzzing and edge cases
   - Verify sanitization is effective

3. **Dependencies**
   - Keep dependencies up to date
   - Review security advisories
   - Use `npm audit` and `flutter pub outdated`

## Known Limitations

1. **Local Network Only**: Dev-Proxy is designed for local development, not production
2. **No TLS by Default**: WebSocket connections are unencrypted (use WSS for remote)
3. **Basic Sanitization**: String sanitization is basic; consider additional measures for production
4. **No User Authentication**: Sessions are protected by tokens only, no user accounts
5. **No Audit Logging**: Security events are logged but not persisted

## Security Reporting

If you discover a security vulnerability in Lumora, please report it to the maintainers:

1. **Do not** open a public GitHub issue
2. Email security details to the project maintainers
3. Include steps to reproduce the vulnerability
4. Allow time for a fix before public disclosure

## Security Checklist

Use this checklist when deploying or using Lumora:

- [ ] Dev-Proxy is only accessible on local network
- [ ] Session tokens are kept confidential
- [ ] WebSocket connections use WSS for remote access
- [ ] Custom renderers are reviewed for security
- [ ] Generated Dart code is reviewed before deployment
- [ ] Dependencies are up to date
- [ ] Security tests are passing
- [ ] Rate limits are appropriate for your use case
- [ ] Connection limits are appropriate for your team size
- [ ] Schema validation is enabled

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WebSocket Security](https://owasp.org/www-community/vulnerabilities/WebSocket_Security)
- [Flutter Security Best Practices](https://flutter.dev/docs/deployment/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Version History

- **v1.0.0** (2025-01-09): Initial security implementation
  - Token security measures
  - WebSocket security (rate limiting, origin validation, connection limits)
  - Schema validation security (whitelisting, sanitization)
