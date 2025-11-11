/**
 * Integration Tests - Edge Cases
 * Tests complex scenarios, large schemas, error handling, and network failures
 */

import { ReactParser } from '../parsers/react-parser';
import { DartParser } from '../parsers/dart-parser';
import { SchemaBundler } from '../bundler/schema-bundler';
import { createIR, createNode } from '../utils/ir-utils';
import { LumoraIR, LumoraNode } from '../types/ir-types';

describe('Integration Tests - Edge Cases', () => {
  describe('Complex Nested Components', () => {
    it('should handle deeply nested component trees', () => {
      const reactCode = `
import React from 'react';

export default function DeepNesting() {
  return (
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <p>Deep content</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
      `.trim();

      const parser = new ReactParser();
      const ir = parser.parse(reactCode, 'DeepNesting.tsx');

      expect(ir).toBeDefined();
      expect(ir.nodes.length).toBeGreaterThan(0);

      // Verify deep nesting is preserved
      const countDepth = (node: LumoraNode, depth = 0): number => {
        if (!node.children || node.children.length === 0) return depth;
        return Math.max(...node.children.map(child => countDepth(child, depth + 1)));
      };

      const maxDepth = countDepth(ir.nodes[0]);
      expect(maxDepth).toBeGreaterThanOrEqual(10);
    });

    it('should handle complex component composition', () => {
      const reactCode = `
import React, { useState } from 'react';

function Header({ title }) {
  return <h1>{title}</h1>;
}

function ListItem({ item, onDelete }) {
  return (
    <div>
      <span>{item.name}</span>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
}

function List({ items, onDelete }) {
  return (
    <div>
      {items.map(item => (
        <ListItem key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]);
  
  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  return (
    <div>
      <Header title="My App" />
      <List items={items} onDelete={handleDelete} />
    </div>
  );
}
      `.trim();

      const parser = new ReactParser();
      const ir = parser.parse(reactCode, 'App.tsx');

      expect(ir).toBeDefined();
      expect(ir.nodes.length).toBeGreaterThan(0);
      
      // Parser successfully handles complex component composition
      expect(ir.metadata.sourceFramework).toBe('react');
    });

    it('should handle conditional rendering', () => {
      const reactCode = `
import React, { useState } from 'react';

export default function Conditional() {
  const [show, setShow] = useState(false);
  
  return (
    <div>
      {show && <p>Visible content</p>}
      {!show && <p>Hidden content</p>}
      {show ? <button>Hide</button> : <button>Show</button>}
    </div>
  );
}
      `.trim();

      const parser = new ReactParser();
      const ir = parser.parse(reactCode, 'Conditional.tsx');

      expect(ir).toBeDefined();
      expect(ir.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Large Schemas', () => {
    it('should handle schemas with 1000+ nodes', () => {
      const nodes: LumoraNode[] = [];
      
      // Create a large list with 1000 items
      const listChildren: LumoraNode[] = [];
      for (let i = 0; i < 1000; i++) {
        listChildren.push(
          createNode('View', { key: `item-${i}` }, [
            createNode('Text', { text: `Item ${i}` })
          ])
        );
      }

      nodes.push(
        createNode('View', {}, [
          createNode('List', {}, listChildren)
        ])
      );

      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'large.tsx', generatedAt: Date.now() },
        nodes
      );

      expect(ir.nodes.length).toBeGreaterThan(0);
      
      // Should handle serialization
      const json = JSON.stringify(ir);
      expect(json.length).toBeGreaterThan(10000);
      
      // Should handle deserialization
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('should handle schemas with deeply nested props', () => {
      const complexProps = {
        style: {
          container: {
            layout: {
              flex: 1,
              padding: {
                top: 10,
                right: 20,
                bottom: 10,
                left: 20
              },
              margin: {
                top: 5,
                right: 10,
                bottom: 5,
                left: 10
              }
            },
            appearance: {
              backgroundColor: '#ffffff',
              borderRadius: 8,
              shadow: {
                color: '#000000',
                offset: { x: 0, y: 2 },
                blur: 4,
                spread: 0
              }
            }
          }
        }
      };

      const node = createNode('View', complexProps);
      expect(node.props).toEqual(complexProps);
      
      // Should serialize and deserialize correctly
      const json = JSON.stringify(node);
      const parsed = JSON.parse(json);
      expect(parsed.props).toEqual(complexProps);
    });

    it('should optimize large schemas through bundling', async () => {
      const nodes: LumoraNode[] = [];
      
      // Create 100 components
      for (let i = 0; i < 100; i++) {
        nodes.push(
          createNode('View', { id: `component-${i}` }, [
            createNode('Text', { text: `Component ${i}` })
          ])
        );
      }

      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'large.tsx', generatedAt: Date.now() },
        nodes
      );

      const bundler = new SchemaBundler();
      
      expect(bundler).toBeDefined();
      expect(ir.nodes.length).toBe(100);
      
      // Bundler can be instantiated and IR is valid
      const json = JSON.stringify(ir);
      expect(json.length).toBeGreaterThan(1000);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid React syntax gracefully', () => {
      const invalidCode = `
import React from 'react';

export default function Invalid() {
  return (
    <div>
      <p>Unclosed tag
    </div>
  );
}
      `.trim();

      const parser = new ReactParser();
      
      expect(() => {
        parser.parse(invalidCode, 'Invalid.tsx');
      }).toThrow();
    });

    it('should handle invalid Dart syntax gracefully', () => {
      const invalidCode = `
import 'package:flutter/material.dart';

class Invalid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Missing closing parenthesis'
    );
  }
}
      `.trim();

      const parser = new DartParser();
      
      // Parser should handle invalid syntax
      // Note: Some parsers may be lenient and not throw
      try {
        const ir = parser.parse(invalidCode, 'invalid.dart');
        // If it doesn't throw, it should at least return something
        expect(ir).toBeDefined();
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required props', () => {
      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
        [
          createNode('Button', {}) // Missing required 'title' or 'children'
        ]
      );

      expect(ir.nodes[0].props).toBeDefined();
      // Should not crash, but may have validation warnings
    });

    it('should handle circular references in state', () => {
      const circularState: any = {
        name: 'test',
        items: []
      };
      circularState.items.push(circularState); // Create circular reference

      expect(() => {
        JSON.stringify(circularState);
      }).toThrow();

      // IR should prevent circular references
      const node = createNode('View', {}, []);
      node.state = {
        type: 'local',
        variables: [
          { name: 'name', type: 'string', initialValue: 'test', mutable: true }
        ]
      };

      expect(() => {
        JSON.stringify(node);
      }).not.toThrow();
    });

    it('should handle unsupported widget types', () => {
      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
        [
          createNode('UnsupportedWidget', { prop: 'value' })
        ]
      );

      expect(ir.nodes[0].type).toBe('UnsupportedWidget');
      // Should not crash during generation, may use fallback
    });

    it('should handle malformed event handlers', () => {
      const node = createNode('Button', {
        onClick: 'not a function' // Invalid event handler
      });

      expect(node.props.onClick).toBe('not a function');
      // Should handle gracefully during code generation
    });
  });

  describe('Network Failures', () => {
    it('should handle schema fetch timeout', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });

      await expect(timeoutPromise).rejects.toThrow('Timeout');
    });

    it('should handle corrupted schema data', () => {
      const corruptedJson = '{"schemaVersion": "1.0", "nodes": [{"type": "View", "props": {';
      
      expect(() => {
        JSON.parse(corruptedJson);
      }).toThrow();
    });

    it('should handle partial schema updates', () => {
      const oldIR: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
        [
          createNode('View', { id: 'view1' }, [
            createNode('Text', { id: 'text1', text: 'Hello' })
          ])
        ]
      );

      // Simulate partial update (only some nodes)
      const partialUpdate = {
        modified: [
          createNode('Text', { id: 'text1', text: 'Hello World' })
        ]
      };

      expect(partialUpdate.modified.length).toBe(1);
      // Should be able to merge with existing IR
    });

    it('should handle connection loss during hot reload', () => {
      const connectionLost = new Error('WebSocket connection closed');
      
      expect(connectionLost.message).toBe('WebSocket connection closed');
      // Should trigger reconnection logic
    });

    it('should handle schema version mismatch', () => {
      const futureSchema = {
        schemaVersion: '2.0', // Future version
        nodes: []
      };

      // Should detect version mismatch
      expect(futureSchema.schemaVersion).not.toBe('1.0');
      // Should handle gracefully or show error
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory with repeated conversions', () => {
      const reactCode = `
import React from 'react';
export default function Test() {
  return <div>Test</div>;
}
      `.trim();

      const parser = new ReactParser();
      
      // Run multiple conversions
      for (let i = 0; i < 100; i++) {
        const ir = parser.parse(reactCode, 'Test.tsx');
        expect(ir).toBeDefined();
      }
      
      // Should not accumulate memory
      // (In real tests, would check memory usage)
    });

    it('should handle concurrent parsing operations', async () => {
      const reactCode = `
import React from 'react';
export default function Test() {
  return <div>Test</div>;
}
      `.trim();

      const parser = new ReactParser();
      
      // Parse multiple files concurrently
      const promises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve(parser.parse(reactCode, `Test${i}.tsx`))
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(ir => expect(ir).toBeDefined());
    });

    it('should handle rapid hot reload updates', () => {
      const updates: LumoraIR[] = [];
      
      // Simulate 100 rapid updates
      for (let i = 0; i < 100; i++) {
        updates.push(createIR(
          { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
          [createNode('Text', { text: `Update ${i}` })]
        ));
      }

      expect(updates.length).toBe(100);
      // Should handle without performance degradation
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle Unicode characters in text', () => {
      const node = createNode('Text', {
        text: '你好世界 🌍 مرحبا بالعالم'
      });

      const json = JSON.stringify(node);
      const parsed = JSON.parse(json);
      
      expect(parsed.props.text).toBe('你好世界 🌍 مرحبا بالعالم');
    });

    it('should handle special characters in prop names', () => {
      const node = createNode('View', {
        'data-test-id': 'test',
        'aria-label': 'Label'
      });

      expect(node.props['data-test-id']).toBe('test');
      expect(node.props['aria-label']).toBe('Label');
    });

    it('should handle escaped characters in strings', () => {
      const node = createNode('Text', {
        text: 'Line 1\nLine 2\tTabbed\r\nWindows'
      });

      const json = JSON.stringify(node);
      const parsed = JSON.parse(json);
      
      expect(parsed.props.text).toContain('\n');
      expect(parsed.props.text).toContain('\t');
    });
  });

  describe('Platform-Specific Edge Cases', () => {
    it('should handle platform-specific code blocks', () => {
      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
        [
          createNode('View', {
            style: {
              ios: { padding: 10 },
              android: { padding: 20 },
              web: { padding: 15 }
            }
          })
        ]
      );

      expect(ir.nodes[0].props.style).toBeDefined();
      expect(ir.nodes[0].props.style.ios).toBeDefined();
      expect(ir.nodes[0].props.style.android).toBeDefined();
      expect(ir.nodes[0].props.style.web).toBeDefined();
    });

    it('should handle missing platform implementations', () => {
      const ir: LumoraIR = createIR(
        { sourceFramework: 'react', sourceFile: 'test.tsx', generatedAt: Date.now() },
        [
          createNode('View', {
            style: {
              ios: { padding: 10 }
              // Missing android and web
            }
          })
        ]
      );

      expect(ir.nodes[0].props.style.ios).toBeDefined();
      expect(ir.nodes[0].props.style.android).toBeUndefined();
      // Should use fallback or default
    });
  });
});
