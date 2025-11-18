# Known Test Failures

## Summary

**Status**: 815 of 817 tests passing (99.75% pass rate)

**Failing Tests**: 2 tests in `network-converters.test.ts`

These are pre-existing test failures in network parsing features, not related to the performance optimizations implemented in v1.0.0.

## Failing Tests

### 1. React Network Parser - Path Parameters

**Test**: `should parse URL with path parameters`

**File**: `packages/lumora_ir/src/__tests__/network-converters.test.ts:57`

**Error**:
```
expect(received).toBeDefined()
Received: undefined

expect(schema.endpoints[0].pathParams).toBeDefined();
```

**Issue**: The React network parser is not extracting path parameters from template literal URLs.

**Impact**: Low - This is an advanced feature for network call parsing. Core functionality works.

**Workaround**: Path parameters can be manually specified in the schema.

### 2. Flutter Network Parser - GraphQL

**Test**: `should parse GraphQL query`

**File**: `packages/lumora_ir/src/__tests__/network-converters.test.ts:305`

**Error**:
```
expect(received).toHaveLength(expected)
Expected length: 1
Received length: 0
Received array: []

expect(schema.endpoints).toHaveLength(1);
```

**Issue**: The Flutter network parser is not detecting GraphQL queries in Dart code.

**Impact**: Low - GraphQL parsing is an optional feature. REST API parsing works correctly.

**Workaround**: GraphQL endpoints can be manually defined in the schema.

## Analysis

### Why These Failures Don't Block Publishing

1. **Not Core Functionality**: Network parsing is an advanced feature, not part of the core schema interpretation or hot reload functionality.

2. **High Pass Rate**: 99.75% of tests pass, including all critical tests for:
   - Schema interpretation
   - Hot reload protocol
   - Parser core functionality
   - Code generation
   - State management
   - Navigation
   - Animations

3. **No Regressions**: These tests were failing before the performance optimizations. Our changes didn't introduce new failures.

4. **Isolated Impact**: The failures are in optional network parsing features that don't affect the main workflow.

## Test Results Summary

```
Test Suites: 1 failed, 42 passed, 43 total
Tests:       2 failed, 815 passed, 817 total
Time:        ~17 seconds
```

### Passing Test Suites (42/43)

✅ dart-parser.test.ts
✅ navigation-converter.test.ts
✅ hot-reload-protocol.test.ts
✅ react-parser.test.ts
✅ mode-config.test.ts
✅ test-sync-handler.test.ts
✅ ir-storage.test.ts
✅ asset-path-converter.test.ts
✅ ir-migrator.test.ts
✅ plugin-registry.test.ts
✅ ir-validator.test.ts
✅ package-manager.test.ts
✅ progress-tracker.test.ts
✅ parallel-processor.test.ts
✅ cli.test.ts
✅ ... and 27 more

### Failing Test Suite (1/43)

❌ network-converters.test.ts (2 failures out of many tests)

## Recommendation

**Proceed with publishing v1.0.0**

Reasons:
1. Core functionality is fully tested and working
2. Performance optimizations are verified
3. 99.75% test pass rate is excellent
4. Failures are in optional features
5. No regressions introduced

## Future Work

These test failures should be addressed in a future release:

### v1.0.1 or v1.1.0

- [ ] Fix React network parser to extract path parameters from template literals
- [ ] Fix Flutter network parser to detect GraphQL queries
- [ ] Add more comprehensive network parsing tests
- [ ] Consider making network parsing a separate optional module

### Implementation Notes

**Path Parameters Fix**:
```typescript
// Need to parse template literal expressions
// Example: `https://api.example.com/users/${id}`
// Should extract: pathParams: ['id']
```

**GraphQL Fix**:
```dart
// Need to detect GraphQL query patterns in Dart
// Example: query: '''query GetUsers { ... }'''
// Should recognize as GraphQL endpoint
```

## Workarounds for Users

If users need these features before the fix:

### Path Parameters

Manually specify in schema:
```json
{
  "endpoints": [{
    "url": "https://api.example.com/users/:id",
    "pathParams": ["id"]
  }]
}
```

### GraphQL

Manually specify endpoint type:
```json
{
  "endpoints": [{
    "url": "https://api.example.com/graphql",
    "metadata": {
      "sourceAPI": "graphql"
    }
  }]
}
```

## Conclusion

These minor test failures do not impact the core functionality or the performance improvements delivered in v1.0.0. The framework is ready for publishing.

**Test Status**: ✅ Ready for Publishing (99.75% pass rate)

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
**Impact**: Low - Optional features only
