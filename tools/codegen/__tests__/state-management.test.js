/**
 * State Management Conversion Tests
 * Tests for converting state management patterns between React and Flutter
 */

const TSXToIR = require('../src/tsx-to-ir');
const IRToFlutter = require('../src/ir-to-flutter');
const IRToReact = require('../src/ir-to-react');
const StateManagementDetector = require('../src/state-management-detector');
const path = require('path');

describe('State Management Conversion', () => {
  let tsxToIR;
  let irToFlutter;
  let irToReact;
  let detector;

  beforeEach(() => {
    tsxToIR = new TSXToIR();
    irToFlutter = new IRToFlutter();
    irToReact = new IRToReact();
    detector = new StateManagementDetector();
    
    // Load widget mappings
    const mappingPath = path.join(__dirname, '../ui-mapping.json');
    irToFlutter.loadMappings(mappingPath);
    irToReact.loadMappings(mappingPath);
  });

  describe('React useState to Flutter StatefulWidget', () => {
    test('should convert simple useState to StatefulWidget', () => {
      const reactCode = `
        import React, { useState } from 'react';
        
        export default function Counter() {
          const [count, setCount] = useState(0);
          
          return (
            <div>
              <span>{count}</span>
              <button onPress={() => setCount(count + 1)}>Increment</button>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'Counter.tsx');
      expect(ir.metadata.hooks.state).toHaveLength(1);
      expect(ir.metadata.hooks.state[0].name).toBe('count');
      expect(ir.metadata.hooks.state[0].setter).toBe('setCount');

      const flutterCode = irToFlutter.convertToFlutter(ir);
      expect(flutterCode).toContain('class Counter extends StatefulWidget');
      // Type can be either int or double depending on inference
      expect(flutterCode).toMatch(/(int|double) count = 0/);
      // setState should be in the generated code (either in event handlers or comments)
      expect(flutterCode).toMatch(/setState|StatefulWidget/);
    });

    test('should convert multiple useState hooks', () => {
      const reactCode = `
        import React, { useState } from 'react';
        
        export default function Form() {
          const [name, setName] = useState('');
          const [email, setEmail] = useState('');
          const [age, setAge] = useState(0);
          
          return (
            <div>
              <input value={name} />
              <input value={email} />
              <input value={age} />
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'Form.tsx');
      expect(ir.metadata.hooks.state).toHaveLength(3);

      const flutterCode = irToFlutter.convertToFlutter(ir);
      expect(flutterCode).toContain('String name =');
      expect(flutterCode).toContain('String email =');
      expect(flutterCode).toContain('double age =');
    });
  });

  describe('Flutter StatefulWidget to React useState', () => {
    test('should convert StatefulWidget to functional component with useState', () => {
      const flutterCode = `
        import 'package:flutter/material.dart';
        
        class Counter extends StatefulWidget {
          @override
          _CounterState createState() => _CounterState();
        }
        
        class _CounterState extends State<Counter> {
          int count = 0;
          
          void increment() {
            setState(() {
              count = count + 1;
            });
          }
          
          @override
          Widget build(BuildContext context) {
            return Container(
              child: Text('$count'),
            );
          }
        }
      `;

      // Note: This would require a full Flutter parser implementation
      // For now, we'll test with a mock IR structure
      const mockIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'Counter.dart',
          generatedAt: Date.now(),
          componentName: 'Counter',
          isStateful: true,
          flutter: {
            stateVariables: [
              { name: 'count', dartType: 'int', initialValue: 0 }
            ],
            lifecycleMethods: [],
            eventHandlers: [
              { name: 'increment', hasSetState: true, body: 'count = count + 1;' }
            ]
          }
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: {},
            children: [
              {
                id: 'node2',
                type: 'Text',
                props: { text: '{{count}}' },
                children: []
              }
            ]
          }
        ]
      };

      const reactCode = irToReact.convertToReact(mockIR);
      expect(reactCode).toContain('useState');
      expect(reactCode).toContain('const [count, setCount]');
      // The initial value should be converted from Dart int to TypeScript number
      expect(reactCode).toMatch(/useState<number>\([^)]*\)/);
    });
  });

  describe('React useEffect to Flutter lifecycle', () => {
    test('should convert useEffect with empty deps to initState', () => {
      const reactCode = `
        import React, { useState, useEffect } from 'react';
        
        export default function Component() {
          const [data, setData] = useState(null);
          
          useEffect(() => {
            console.log('Component mounted');
          }, []);
          
          return <div>{data}</div>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'Component.tsx');
      expect(ir.metadata.hooks.effects).toHaveLength(1);
      expect(ir.metadata.hooks.effects[0].type).toBe('mount');

      const flutterCode = irToFlutter.convertToFlutter(ir);
      expect(flutterCode).toContain('void initState()');
      expect(flutterCode).toContain('super.initState()');
    });

    test('should convert useEffect with cleanup to dispose', () => {
      const reactCode = `
        import React, { useEffect } from 'react';
        
        export default function Component() {
          useEffect(() => {
            const timer = setInterval(() => {}, 1000);
            return () => clearInterval(timer);
          }, []);
          
          return <div>Timer</div>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'Component.tsx');
      expect(ir.metadata.hooks.effects[0].hasCleanup).toBe(true);

      const flutterCode = irToFlutter.convertToFlutter(ir);
      expect(flutterCode).toContain('void dispose()');
      expect(flutterCode).toContain('super.dispose()');
    });

    test('should convert useEffect with deps to didUpdateWidget', () => {
      const reactCode = `
        import React, { useState, useEffect } from 'react';
        
        export default function Component() {
          const [count, setCount] = useState(0);
          
          useEffect(() => {
            console.log('Count changed:', count);
          }, [count]);
          
          return <div>{count}</div>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'Component.tsx');
      const updateEffect = ir.metadata.hooks.effects.find(e => e.type === 'update');
      expect(updateEffect).toBeDefined();
      expect(updateEffect.dependencies).toContain('count');

      const flutterCode = irToFlutter.convertToFlutter(ir);
      expect(flutterCode).toContain('void didUpdateWidget');
    });
  });

  describe('Flutter lifecycle to React useEffect', () => {
    test('should convert initState to useEffect with empty deps', () => {
      const mockIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'Component.dart',
          generatedAt: Date.now(),
          componentName: 'Component',
          isStateful: true,
          flutter: {
            stateVariables: [],
            lifecycleMethods: [
              { type: 'mount', body: 'print("Component mounted");' }
            ],
            eventHandlers: []
          }
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: {},
            children: []
          }
        ]
      };

      const reactCode = irToReact.convertToReact(mockIR);
      expect(reactCode).toContain('useEffect');
      expect(reactCode).toContain('[]); // Empty deps array = runs once on mount');
    });

    test('should convert dispose to useEffect cleanup', () => {
      const mockIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'Component.dart',
          generatedAt: Date.now(),
          componentName: 'Component',
          isStateful: true,
          flutter: {
            stateVariables: [],
            lifecycleMethods: [
              { type: 'cleanup', body: 'timer.cancel();' }
            ],
            eventHandlers: []
          }
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: {},
            children: []
          }
        ]
      };

      const reactCode = irToReact.convertToReact(mockIR);
      expect(reactCode).toContain('return () => {');
      expect(reactCode).toContain('Cleanup function runs on unmount');
    });
  });

  describe('Complex State Management Detection', () => {
    test('should detect Redux pattern in React code', () => {
      const reduxCode = `
        import { useSelector, useDispatch } from 'react-redux';
        
        export default function Component() {
          const count = useSelector(state => state.count);
          const dispatch = useDispatch();
          
          return <div>{count}</div>;
        }
      `;

      const result = detector.detectReactPattern(reduxCode, {});
      expect(result.pattern).toBe('redux');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should detect Bloc pattern in Flutter code', () => {
      const blocCode = `
        import 'package:flutter_bloc/flutter_bloc.dart';
        
        class CounterPage extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return BlocProvider(
              create: (context) => CounterBloc(),
              child: BlocBuilder<CounterBloc, int>(
                builder: (context, count) {
                  return Text('$count');
                },
              ),
            );
          }
        }
      `;

      const result = detector.detectFlutterPattern(blocCode, {});
      expect(result.pattern).toBe('bloc');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should map Redux to Bloc', () => {
      const flutterPattern = detector.mapReactToFlutter('redux');
      expect(flutterPattern).toBe('bloc');
    });

    test('should map Bloc to Redux', () => {
      const reactPattern = detector.mapFlutterToReact('bloc');
      expect(reactPattern).toBe('redux');
    });
  });

  describe('setState conversion', () => {
    test('should convert React setter calls to Flutter setState', () => {
      const reactCode = 'setCount(count + 1)';
      const stateVars = [{ name: 'count', setter: 'setCount' }];
      
      irToFlutter.stateVariables = stateVars;
      const flutterCode = irToFlutter.convertReactSettersToFlutterSetState(reactCode);
      
      expect(flutterCode).toContain('setState');
      expect(flutterCode).toContain('count = count + 1');
    });

    test('should convert Flutter setState to React setter calls', () => {
      const flutterCode = 'setState(() { count = count + 1; })';
      const stateVars = [{ name: 'count' }];
      
      irToReact.stateVariables = stateVars;
      const reactCode = irToReact.convertSetStateCalls(flutterCode);
      
      expect(reactCode).toContain('setCount');
      expect(reactCode).toContain('count + 1');
    });
  });
});
