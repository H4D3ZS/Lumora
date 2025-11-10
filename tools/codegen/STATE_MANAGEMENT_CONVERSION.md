# State Management Conversion Implementation

## Overview

This document describes the implementation of bidirectional state management conversion between React and Flutter, completed as part of Task 8 in the Lumora Bidirectional Framework Phase 1.

## Implemented Features

### 8.1 Convert React useState to Flutter StatefulWidget ✅

**Implementation:**
- Enhanced `tsx-to-ir.js` to extract `useState` hooks with proper type inference
- Updated `ir-to-flutter.js` to generate StatefulWidget classes with state variables
- Added conversion of React state setter calls to Flutter `setState()` calls
- Properly handles multiple state variables in a single component

**Example:**
```typescript
// React
const [count, setCount] = useState(0);
setCount(count + 1);
```

Converts to:
```dart
// Flutter
class _ComponentState extends State<Component> {
  double count = 0;
  
  void handleIncrement() {
    setState(() {
      count = count + 1;
    });
  }
}
```

### 8.2 Convert Flutter StatefulWidget to React useState ✅

**Implementation:**
- Enhanced `flutter-to-ir.js` to extract state variables from StatefulWidget
- Updated `ir-to-react.js` to generate functional components with `useState` hooks
- Added conversion of Flutter `setState()` calls to React state setter calls
- Properly generates TypeScript type annotations

**Example:**
```dart
// Flutter
class _CounterState extends State<Counter> {
  int count = 0;
  
  void increment() {
    setState(() {
      count = count + 1;
    });
  }
}
```

Converts to:
```typescript
// React
const Counter: React.FC<CounterProps> = (props) => {
  const [count, setCount] = useState<number>(0);
  
  const increment = () => {
    setCount(count + 1);
  };
};
```

### 8.3 Convert React useEffect to Flutter Lifecycle ✅

**Implementation:**
- Enhanced `tsx-to-ir.js` to extract `useEffect` hooks with dependency tracking
- Updated `ir-to-flutter.js` to generate appropriate lifecycle methods:
  - `useEffect(() => {}, [])` → `initState()`
  - `useEffect(() => { return cleanup; }, [])` → `dispose()`
  - `useEffect(() => {}, [deps])` → `didUpdateWidget()`

**Example:**
```typescript
// React
useEffect(() => {
  console.log('Mounted');
}, []);

useEffect(() => {
  return () => console.log('Cleanup');
}, []);

useEffect(() => {
  console.log('Count changed');
}, [count]);
```

Converts to:
```dart
// Flutter
@override
void initState() {
  super.initState();
  // Converted from React useEffect with empty dependency array
  print('Mounted');
}

@override
void dispose() {
  // Converted from React useEffect cleanup function
  print('Cleanup');
  super.dispose();
}

@override
void didUpdateWidget(covariant Widget oldWidget) {
  super.didUpdateWidget(oldWidget);
  // Converted from React useEffect with dependencies
  // Check if dependencies changed: count
  print('Count changed');
}
```

### 8.4 Convert Flutter Lifecycle to React useEffect ✅

**Implementation:**
- Enhanced `flutter-parser.js` to extract lifecycle methods from StatefulWidget
- Updated `ir-to-react.js` to generate `useEffect` hooks with proper dependencies:
  - `initState()` → `useEffect(() => {}, [])`
  - `dispose()` → `useEffect(() => { return cleanup; }, [])`
  - `didUpdateWidget()` → `useEffect(() => {}, [deps])`

**Example:**
```dart
// Flutter
@override
void initState() {
  super.initState();
  print('Mounted');
}

@override
void dispose() {
  print('Cleanup');
  super.dispose();
}
```

Converts to:
```typescript
// React
// Converted from Flutter initState
useEffect(() => {
  console.log('Mounted');
}, []); // Empty deps array = runs once on mount

// Converted from Flutter dispose
useEffect(() => {
  return () => {
    console.log('Cleanup');
  };
}, []); // Cleanup function runs on unmount
```

### 8.5 Support Complex State Management ✅

**Implementation:**
- Created `state-management-detector.js` to detect state management patterns
- Supports detection of:
  - **React:** Redux, MobX, Recoil, Zustand, Jotai
  - **Flutter:** Bloc, Riverpod, Provider, GetX
- Adds pattern metadata to IR for preservation during conversion
- Generates appropriate imports and comments for complex patterns
- Maps patterns between frameworks:
  - Redux ↔ Bloc
  - MobX ↔ Provider
  - Recoil/Zustand/Jotai ↔ Riverpod

**Example:**
```typescript
// React with Redux
import { useSelector, useDispatch } from 'react-redux';

export default function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  // ...
}
```

Detected pattern: `redux` (confidence: 0.67)
Target Flutter pattern: `bloc`

Generated Flutter code includes:
```dart
/// Converted from React redux pattern
/// Target Flutter pattern: bloc
/// Confidence: 67%

import 'package:flutter_bloc/flutter_bloc.dart';

// TODO: Implement bloc pattern
// This component uses bloc for state management
// Please refer to bloc documentation for proper implementation
```

## Architecture

### State Management Detector

The `StateManagementDetector` class provides:

1. **Pattern Detection:**
   - Scans code for framework-specific keywords and patterns
   - Calculates confidence scores based on pattern matches
   - Extracts features (hooks, providers, builders, etc.)

2. **Pattern Mapping:**
   - Maps React patterns to Flutter equivalents
   - Maps Flutter patterns to React equivalents
   - Preserves pattern information in IR metadata

3. **Supported Patterns:**

| React Pattern | Flutter Equivalent | Confidence Threshold |
|--------------|-------------------|---------------------|
| useState | setState | 1.0 |
| Redux | Bloc | 0.33+ |
| MobX | Provider | 0.33+ |
| Recoil | Riverpod | 0.33+ |
| Zustand | Riverpod | 0.33+ |
| Jotai | Riverpod | 0.33+ |

### IR Metadata Structure

State management information is stored in the IR metadata:

```typescript
{
  metadata: {
    stateManagement: {
      pattern: 'redux',           // Detected pattern
      confidence: 0.67,            // Confidence score (0-1)
      features: [                  // Detected features
        { type: 'selector', name: 'useSelector' },
        { type: 'dispatch', name: 'useDispatch' }
      ],
      targetPattern: 'bloc'        // Target framework pattern
    },
    hooks: {
      state: [...],                // useState hooks
      effects: [...],              // useEffect hooks
      contexts: [...],             // useContext hooks
      callbacks: [...],            // useCallback hooks
      memos: [...]                 // useMemo hooks
    }
  }
}
```

## Testing

Comprehensive test suite with 14 tests covering:

1. **React useState to Flutter StatefulWidget** (2 tests)
   - Simple state conversion
   - Multiple state variables

2. **Flutter StatefulWidget to React useState** (1 test)
   - State variable conversion with proper types

3. **React useEffect to Flutter Lifecycle** (3 tests)
   - Mount effects → initState
   - Cleanup effects → dispose
   - Update effects → didUpdateWidget

4. **Flutter Lifecycle to React useEffect** (2 tests)
   - initState → useEffect with empty deps
   - dispose → useEffect cleanup

5. **Complex State Management Detection** (4 tests)
   - Redux pattern detection
   - Bloc pattern detection
   - Pattern mapping (Redux ↔ Bloc)

6. **setState Conversion** (2 tests)
   - React setter → Flutter setState
   - Flutter setState → React setter

**Test Results:** ✅ All 14 tests passing

## Usage Examples

### Basic State Conversion

```bash
# Convert React component with useState to Flutter
node cli.js tsx2ir examples/state-management-example.tsx output.json
node cli.js ir2flutter output.json output.dart ui-mapping.json

# Convert Flutter StatefulWidget to React
node cli.js flutter2ir examples/counter.dart output.json
node cli.js ir2react output.json output.tsx ui-mapping.json
```

### Complex State Management

The system automatically detects and preserves complex state management patterns:

```typescript
// Input: React with Redux
import { useSelector, useDispatch } from 'react-redux';

// Output: Flutter with Bloc (with TODO comments)
import 'package:flutter_bloc/flutter_bloc.dart';
// TODO: Implement bloc pattern
```

## Limitations and Future Work

### Current Limitations

1. **Complex Pattern Implementation:**
   - Detection works, but full conversion requires manual implementation
   - Generated code includes TODO comments for complex patterns
   - Developers need to implement pattern-specific logic

2. **Type Inference:**
   - Basic type mapping (string → String, number → double/int)
   - Complex generic types may need manual adjustment

3. **Event Handler Bodies:**
   - Simple event handlers convert well
   - Complex logic may need manual review

### Future Enhancements

1. **Full Pattern Conversion:**
   - Complete Redux → Bloc conversion with actions/events
   - MobX → Provider with ChangeNotifier
   - Recoil → Riverpod with StateNotifier

2. **Advanced Type Mapping:**
   - Generic type preservation
   - Custom type definitions
   - Interface/class conversion

3. **Code Optimization:**
   - Remove unnecessary setState calls
   - Optimize effect dependencies
   - Merge similar lifecycle methods

## Files Modified

1. **tools/codegen/src/tsx-to-ir.js**
   - Added state management pattern detection
   - Enhanced useState and useEffect extraction

2. **tools/codegen/src/ir-to-flutter.js**
   - Added StatefulWidget generation with setState
   - Enhanced lifecycle method generation
   - Added complex pattern support

3. **tools/codegen/src/flutter-to-ir.js**
   - Added state management pattern detection
   - Enhanced state variable extraction

4. **tools/codegen/src/ir-to-react.js**
   - Added useState hook generation
   - Enhanced useEffect hook generation
   - Added setState to setter conversion
   - Added complex pattern support

## Files Created

1. **tools/codegen/src/state-management-detector.js**
   - Pattern detection for React and Flutter
   - Pattern mapping between frameworks
   - Feature extraction

2. **tools/codegen/__tests__/state-management.test.js**
   - Comprehensive test suite (14 tests)
   - Covers all conversion scenarios

3. **tools/codegen/examples/state-management-example.tsx**
   - Example demonstrating useState and useEffect
   - Shows multiple state variables and effects

4. **tools/codegen/STATE_MANAGEMENT_CONVERSION.md**
   - This documentation file

## Conclusion

Task 8 "Add state management conversion" has been successfully completed with all sub-tasks implemented and tested. The system now supports bidirectional conversion of state management patterns between React and Flutter, including:

- ✅ React useState ↔ Flutter StatefulWidget
- ✅ React useEffect ↔ Flutter lifecycle methods
- ✅ Complex pattern detection and preservation
- ✅ Comprehensive test coverage

The implementation provides a solid foundation for state management conversion while maintaining code quality and developer experience.
