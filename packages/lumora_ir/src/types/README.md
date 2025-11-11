# Lumora IR Type Definitions

This directory contains the core type definitions for the Lumora Intermediate Representation (IR) system.

## Files

### Core Types

- **`ir-types.ts`** - Main IR type definitions
  - `LumoraIR` - Root IR structure
  - `LumoraNode` - Widget/component nodes
  - `StateDefinition` - State management
  - `EventDefinition` - Event handlers
  - `LifecycleDefinition` - Component lifecycle

### Animation System

- **`animation-types.ts`** - Animation schema definitions
  - `AnimationSchema` - Core animation definition
  - `AnimatedProperty` - Property animations
  - `AnimationGroup` - Coordinated animations
  - `AnimationTransition` - Page transitions
  - `GestureAnimation` - Gesture-driven animations
  - `ANIMATION_PRESETS` - Built-in animation presets

- **`ANIMATION_SCHEMA.md`** - Comprehensive animation documentation
  - Interface documentation
  - 14 complete examples
  - React/Flutter conversion guides
  - Best practices

- **`ANIMATION_QUICK_REFERENCE.md`** - Quick reference guide
  - Common patterns
  - Cheat sheet
  - Troubleshooting

### Network System

- **`network-types.ts`** - Network schema definitions
  - `NetworkSchema` - Root network configuration
  - `Endpoint` - API endpoint definition
  - `Interceptor` - Request/response middleware
  - `CacheConfig` - Caching configuration
  - `AuthConfig` - Authentication configuration
  - `RetryConfig` - Retry configuration
  - `NETWORK_PRESETS` - Built-in network presets

- **`NETWORK_SCHEMA.md`** - Comprehensive network documentation
  - Interface documentation
  - Complete examples
  - React/Flutter conversion guides
  - Best practices

- **`NETWORK_QUICK_REFERENCE.md`** - Quick reference guide
  - Common patterns
  - Authentication examples
  - Caching strategies
  - Troubleshooting

### Type System

- **`type-mapper.ts`** - Type conversion between frameworks
  - TypeScript ↔ Dart type mapping
  - Generic type handling
  - Type inference

- **`interface-converter.ts`** - Interface/class conversion
  - TypeScript interfaces ↔ Dart classes
  - Property mapping
  - Method conversion

## Usage

### Basic IR Creation

```typescript
import { LumoraIR, LumoraNode, createIR, createNode } from '@lumora/ir';

const node: LumoraNode = createNode(
  'Button',
  { title: 'Click Me', onPress: 'handlePress' },
  [],
  1
);

const ir: LumoraIR = createIR(
  {
    sourceFramework: 'react',
    sourceFile: 'App.tsx',
    generatedAt: Date.now()
  },
  [node]
);
```

### Adding Animations

```typescript
import { AnimationSchema, ANIMATION_PRESETS } from '@lumora/ir';

// Use preset
const fadeIn: AnimationSchema = {
  id: 'fade-in',
  ...ANIMATION_PRESETS.fadeIn.animation
};

// Attach to node
node.animations = ['fade-in'];

// Add to IR
ir.animations = [fadeIn];
```

### Adding Network Configuration

```typescript
import { NetworkSchema, NETWORK_PRESETS } from '@lumora/ir';

// Use preset
const networkSchema: NetworkSchema = {
  ...NETWORK_PRESETS.restAPI.config,
  baseURL: 'https://api.example.com',
  endpoints: [
    {
      id: 'get-users',
      name: 'getUsers',
      method: 'GET',
      path: '/users',
      cacheStrategy: 'cache-first',
      cacheTTL: 300000
    }
  ]
};

// Add to IR
ir.network = networkSchema;
```

### Type Conversion

```typescript
import { TypeMapper } from '@lumora/ir';

const mapper = new TypeMapper();

// TypeScript to Dart
const dartType = mapper.mapToDart('string'); // 'String'
const tsType = mapper.mapToTypeScript('int'); // 'number'
```

## Type Hierarchy

```
LumoraIR
├── version: string
├── metadata: IRMetadata
├── nodes: LumoraNode[]
├── theme?: ThemeDefinition
├── navigationSchema?: NavigationSchema
├── animations?: AnimationSchema[]
├── animationGroups?: AnimationGroup[]
├── transitions?: Record<string, AnimationTransition>
└── network?: NetworkSchema

LumoraNode
├── id: string
├── type: string
├── props: Record<string, any>
├── children: LumoraNode[]
├── state?: StateDefinition
├── events?: EventDefinition[]
├── lifecycle?: LifecycleDefinition[]
├── animations?: string[]
└── metadata: NodeMetadata

AnimationSchema
├── id: string
├── type: 'spring' | 'timing' | 'decay'
├── duration: number
├── easing: EasingType
├── properties: AnimatedProperty[]
├── springConfig?: SpringConfig
├── decayConfig?: DecayConfig
├── callbacks?: AnimationCallbacks
└── metadata?: AnimationMetadata

NetworkSchema
├── baseURL?: string
├── timeout?: number
├── defaultHeaders?: Record<string, string>
├── endpoints: Endpoint[]
├── interceptors?: Interceptor[]
├── caching?: CacheConfig
├── retry?: RetryConfig
├── auth?: AuthConfig
└── metadata?: NetworkMetadata

Endpoint
├── id: string
├── name: string
├── method: HttpMethod
├── path: string
├── pathParams?: ParamDefinition[]
├── queryParams?: ParamDefinition[]
├── body?: BodyDefinition
├── response?: ResponseDefinition
├── cacheStrategy?: CacheStrategy
├── requiresAuth?: boolean
├── callbacks?: EndpointCallbacks
└── metadata?: EndpointMetadata
```

## Framework Support

### React/TypeScript
- JSX/TSX components
- React hooks (useState, useEffect, etc.)
- TypeScript interfaces and types
- CSS transitions and animations
- React Animated API
- Framer Motion

### Flutter/Dart
- StatelessWidget and StatefulWidget
- Dart classes and interfaces
- State management (Bloc, Riverpod, Provider)
- AnimationController
- Tween animations
- ImplicitAnimations

## Validation

All IR structures can be validated using the `IRValidator`:

```typescript
import { IRValidator } from '@lumora/ir';

const validator = new IRValidator();
const result = validator.validate(ir);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Storage and Migration

IR can be stored and migrated between versions:

```typescript
import { IRStorage, IRMigrator } from '@lumora/ir';

// Storage
const storage = new IRStorage();
await storage.save('my-app', ir);
const loaded = await storage.load('my-app');

// Migration
const migrator = new IRMigrator();
const migratedIR = migrator.migrate(oldIR, '2.0');
```

## Best Practices

1. **Use Type Safety**: Always use TypeScript types, don't use `any`
2. **Validate IR**: Validate IR before conversion or storage
3. **Use Presets**: Use animation presets for common patterns
4. **Document Metadata**: Include source information in metadata
5. **Version Control**: Track IR version for migration support
6. **Performance**: Keep node trees shallow, use lazy loading for large apps

## Related Documentation

- [Animation Schema Documentation](./ANIMATION_SCHEMA.md)
- [Animation Quick Reference](./ANIMATION_QUICK_REFERENCE.md)
- [Network Schema Documentation](./NETWORK_SCHEMA.md)
- [Network Quick Reference](./NETWORK_QUICK_REFERENCE.md)
- [Navigation Types](../navigation/navigation-types.ts)
- [State Bridge](../bridge/state-bridge.ts)
- [Main README](../../README.md)

## Contributing

When adding new types:

1. Add type definitions to appropriate file
2. Export from `index.ts`
3. Add JSDoc comments
4. Update this README
5. Add examples to examples directory
6. Update validation schema if needed

## License

MIT License - See LICENSE file for details
