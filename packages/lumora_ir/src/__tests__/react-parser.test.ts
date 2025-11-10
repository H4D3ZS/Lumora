/**
 * React Parser Tests
 */

import { ReactParser } from '../parsers/react-parser';
import { LumoraIR } from '../types/ir-types';

describe('ReactParser', () => {
  let parser: ReactParser;

  beforeEach(() => {
    parser = new ReactParser();
  });

  describe('Component Extraction', () => {
    it('should extract function component', () => {
      const source = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
      expect(ir.metadata.sourceFramework).toBe('react');
    });

    it('should extract arrow function component', () => {
      const source = `
        const MyComponent = () => {
          return <div>Hello</div>;
        };
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
    });

    it('should extract arrow function component with implicit return', () => {
      const source = `
        const MyComponent = () => <div>Hello</div>;
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
    });

    it('should extract class component', () => {
      const source = `
        import React from 'react';
        
        class MyComponent extends React.Component {
          render() {
            return <div>Hello</div>;
          }
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
    });

    it('should extract component with props', () => {
      const source = `
        function MyComponent({ title, count }) {
          return <div>{title}: {count}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].props).toHaveProperty('title');
      expect(ir.nodes[0].props).toHaveProperty('count');
    });

    it('should extract multiple components', () => {
      const source = `
        function ComponentA() {
          return <div>A</div>;
        }
        
        const ComponentB = () => <div>B</div>;
        
        class ComponentC extends React.Component {
          render() {
            return <div>C</div>;
          }
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(3);
      expect(ir.nodes[0].type).toBe('ComponentA');
      expect(ir.nodes[1].type).toBe('ComponentB');
      expect(ir.nodes[2].type).toBe('ComponentC');
    });

    it('should not extract non-component functions', () => {
      const source = `
        function helper() {
          return "not a component";
        }
        
        const MyComponent = () => <div>Component</div>;
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
    });
  });

  describe('JSX Parsing', () => {
    it('should parse simple JSX element', () => {
      const source = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].children).toHaveLength(1);
      expect(ir.nodes[0].children[0].type).toBe('div');
    });

    it('should parse nested JSX elements', () => {
      const source = `
        function MyComponent() {
          return (
            <div>
              <h1>Title</h1>
              <p>Content</p>
            </div>
          );
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const divNode = ir.nodes[0].children[0];
      expect(divNode.type).toBe('div');
      expect(divNode.children).toHaveLength(2);
      expect(divNode.children[0].type).toBe('h1');
      expect(divNode.children[1].type).toBe('p');
    });

    it('should parse JSX with props', () => {
      const source = `
        function MyComponent() {
          return <div className="container" id="main">Content</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const divNode = ir.nodes[0].children[0];
      expect(divNode.props.className).toBe('container');
      expect(divNode.props.id).toBe('main');
    });

    it('should parse JSX with text content', () => {
      const source = `
        function MyComponent() {
          return <div>Hello World</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const divNode = ir.nodes[0].children[0];
      expect(divNode.children).toHaveLength(1);
      expect(divNode.children[0].type).toBe('Text');
      expect(divNode.children[0].props.text).toBe('Hello World');
    });

    it('should parse JSX with expression props', () => {
      const source = `
        function MyComponent() {
          const value = 42;
          return <div count={value}>Content</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const divNode = ir.nodes[0].children[0];
      expect(divNode.props).toHaveProperty('count');
    });

    it('should parse boolean props', () => {
      const source = `
        function MyComponent() {
          return <input disabled />;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const inputNode = ir.nodes[0].children[0];
      expect(inputNode.props.disabled).toBe(true);
    });
  });

  describe('State Extraction', () => {
    it('should extract useState hook', () => {
      const source = `
        import { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.type).toBe('local');
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('count');
      expect(ir.nodes[0].state?.variables[0].initialValue).toBe(0);
      expect(ir.nodes[0].state?.variables[0].type).toBe('number');
    });

    it('should extract multiple useState hooks', () => {
      const source = `
        import { useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('John');
          const [active, setActive] = useState(true);
          return <div>{count} {name}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state?.variables).toHaveLength(3);
      expect(ir.nodes[0].state?.variables[0].type).toBe('number');
      expect(ir.nodes[0].state?.variables[1].type).toBe('string');
      expect(ir.nodes[0].state?.variables[2].type).toBe('boolean');
    });

    it('should infer types from initial values', () => {
      const source = `
        import { useState } from 'react';
        
        function MyComponent() {
          const [items, setItems] = useState([1, 2, 3]);
          const [user, setUser] = useState({ name: 'John' });
          return <div>Component</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state?.variables[0].type).toBe('number[]');
      expect(ir.nodes[0].state?.variables[1].type).toBe('object');
    });
  });

  describe('Hook Parsing - useEffect', () => {
    it('should extract useEffect hook with empty dependencies', () => {
      const source = `
        import { useEffect } from 'react';
        
        function MyComponent() {
          useEffect(() => {
            console.log('mounted');
          }, []);
          return <div>Component</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].lifecycle).toBeDefined();
      expect(ir.nodes[0].lifecycle?.length).toBe(1);
      expect(ir.nodes[0].lifecycle?.[0].type).toBe('mount');
      expect(ir.nodes[0].lifecycle?.[0].dependencies).toEqual([]);
    });

    it('should extract useEffect hook with dependencies', () => {
      const source = `
        import { useEffect, useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          useEffect(() => {
            console.log('count changed:', count);
          }, [count]);
          return <div>{count}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].lifecycle).toBeDefined();
      expect(ir.nodes[0].lifecycle?.length).toBe(1);
      expect(ir.nodes[0].lifecycle?.[0].type).toBe('effect');
      expect(ir.nodes[0].lifecycle?.[0].dependencies).toEqual(['count']);
    });

    it('should extract useEffect hook without dependencies array', () => {
      const source = `
        import { useEffect } from 'react';
        
        function MyComponent() {
          useEffect(() => {
            console.log('every render');
          });
          return <div>Component</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].lifecycle).toBeDefined();
      expect(ir.nodes[0].lifecycle?.length).toBe(1);
      expect(ir.nodes[0].lifecycle?.[0].type).toBe('update');
    });

    it('should extract multiple useEffect hooks', () => {
      const source = `
        import { useEffect, useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');
          
          useEffect(() => {
            console.log('mounted');
          }, []);
          
          useEffect(() => {
            console.log('count changed');
          }, [count]);
          
          useEffect(() => {
            console.log('name changed');
          }, [name]);
          
          return <div>{count} {name}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].lifecycle).toBeDefined();
      expect(ir.nodes[0].lifecycle?.length).toBe(3);
      expect(ir.nodes[0].lifecycle?.[0].type).toBe('mount');
      expect(ir.nodes[0].lifecycle?.[1].type).toBe('effect');
      expect(ir.nodes[0].lifecycle?.[2].type).toBe('effect');
    });
  });

  describe('Hook Parsing - useContext', () => {
    it('should extract useContext hook', () => {
      const source = `
        import { useContext } from 'react';
        
        function MyComponent() {
          const theme = useContext(ThemeContext);
          return <div>{theme}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('theme');
      expect(ir.nodes[0].state?.variables[0].mutable).toBe(false);
    });
  });

  describe('Hook Parsing - useRef', () => {
    it('should extract useRef hook', () => {
      const source = `
        import { useRef } from 'react';
        
        function MyComponent() {
          const inputRef = useRef(null);
          return <input ref={inputRef} />;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('inputRef');
      expect(ir.nodes[0].state?.variables[0].type).toBe('ref');
      expect(ir.nodes[0].state?.variables[0].initialValue).toBe(null);
    });

    it('should extract useRef hook with initial value', () => {
      const source = `
        import { useRef } from 'react';
        
        function MyComponent() {
          const countRef = useRef(0);
          return <div>Component</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state?.variables[0].name).toBe('countRef');
      expect(ir.nodes[0].state?.variables[0].initialValue).toBe(0);
    });
  });

  describe('Hook Parsing - useMemo', () => {
    it('should extract useMemo hook', () => {
      const source = `
        import { useMemo, useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const doubled = useMemo(() => count * 2, [count]);
          return <div>{doubled}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(2);
      expect(ir.nodes[0].state?.variables[1].name).toBe('doubled');
      expect(ir.nodes[0].state?.variables[1].mutable).toBe(false);
    });
  });

  describe('Hook Parsing - useCallback', () => {
    it('should extract useCallback hook', () => {
      const source = `
        import { useCallback, useState } from 'react';
        
        function MyComponent() {
          const [count, setCount] = useState(0);
          const increment = useCallback(() => setCount(c => c + 1), []);
          return <button onClick={increment}>Increment</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(2);
      expect(ir.nodes[0].state?.variables[1].name).toBe('increment');
      expect(ir.nodes[0].state?.variables[1].type).toBe('function');
    });
  });

  describe('Hook Parsing - Custom Hooks', () => {
    it('should extract custom hook', () => {
      const source = `
        function MyComponent() {
          const data = useCustomHook();
          return <div>{data}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('data');
    });

    it('should extract custom hook with destructured return', () => {
      const source = `
        function MyComponent() {
          const [data, loading] = useCustomHook();
          return <div>{data}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('data');
    });

    it('should extract custom hook with object destructuring', () => {
      const source = `
        function MyComponent() {
          const { data, error } = useCustomHook();
          return <div>{data}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].state).toBeDefined();
      expect(ir.nodes[0].state?.variables).toHaveLength(1);
      expect(ir.nodes[0].state?.variables[0].name).toBe('data');
    });
  });

  describe('Event Extraction', () => {
    it('should extract onClick event', () => {
      const source = `
        function MyComponent() {
          const handleClick = () => console.log('clicked');
          return <button onClick={handleClick}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].events).toBeDefined();
      expect(ir.nodes[0].events?.length).toBeGreaterThan(0);
      
      const clickEvent = ir.nodes[0].events?.find(e => e.name === 'onClick');
      expect(clickEvent).toBeDefined();
    });

    it('should extract inline arrow function event', () => {
      const source = `
        function MyComponent() {
          return <button onClick={() => console.log('clicked')}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const clickEvent = ir.nodes[0].events?.find(e => e.name === 'onClick');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.parameters).toHaveLength(0);
    });

    it('should extract event with parameters', () => {
      const source = `
        function MyComponent() {
          return <button onClick={(e) => e.preventDefault()}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const clickEvent = ir.nodes[0].events?.find(e => e.name === 'onClick');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.parameters).toHaveLength(1);
      expect(clickEvent?.parameters[0].name).toBe('e');
    });

    it('should extract multiple event types', () => {
      const source = `
        function MyComponent() {
          return (
            <input 
              onChange={(e) => console.log(e.target.value)}
              onFocus={() => console.log('focused')}
              onBlur={() => console.log('blurred')}
            />
          );
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].events?.length).toBeGreaterThanOrEqual(3);
      expect(ir.nodes[0].events?.some(e => e.name === 'onChange')).toBe(true);
      expect(ir.nodes[0].events?.some(e => e.name === 'onFocus')).toBe(true);
      expect(ir.nodes[0].events?.some(e => e.name === 'onBlur')).toBe(true);
    });

    it('should extract helper function handlers', () => {
      const source = `
        function MyComponent() {
          const handleSubmit = (e) => {
            e.preventDefault();
            console.log('submitted');
          };
          
          function handleReset() {
            console.log('reset');
          }
          
          return (
            <form onSubmit={handleSubmit}>
              <button type="reset" onClick={handleReset}>Reset</button>
            </form>
          );
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].events).toBeDefined();
      
      const submitHandler = ir.nodes[0].events?.find(e => e.name === 'handleSubmit');
      expect(submitHandler).toBeDefined();
      expect(submitHandler?.parameters).toHaveLength(1);
      expect(submitHandler?.parameters[0].name).toBe('e');
      
      const resetHandler = ir.nodes[0].events?.find(e => e.name === 'handleReset');
      expect(resetHandler).toBeDefined();
      expect(resetHandler?.parameters).toHaveLength(0);
    });

    it('should extract class component methods', () => {
      const source = `
        import React from 'react';
        
        class MyComponent extends React.Component {
          handleClick(e) {
            e.preventDefault();
            console.log('clicked');
          }
          
          handleSubmit = (e) => {
            e.preventDefault();
            console.log('submitted');
          }
          
          render() {
            return (
              <div>
                <button onClick={this.handleClick}>Click</button>
                <form onSubmit={this.handleSubmit}>Submit</form>
              </div>
            );
          }
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].events).toBeDefined();
      
      const clickHandler = ir.nodes[0].events?.find(e => e.name === 'handleClick');
      expect(clickHandler).toBeDefined();
      expect(clickHandler?.parameters).toHaveLength(1);
      
      const submitHandler = ir.nodes[0].events?.find(e => e.name === 'handleSubmit');
      expect(submitHandler).toBeDefined();
      expect(submitHandler?.parameters).toHaveLength(1);
    });

    it('should extract handler with complex body', () => {
      const source = `
        function MyComponent() {
          const handleClick = async (e) => {
            e.preventDefault();
            const data = await fetchData();
            if (data) {
              console.log(data);
            }
          };
          
          return <button onClick={handleClick}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const clickHandler = ir.nodes[0].events?.find(e => e.name === 'handleClick');
      expect(clickHandler).toBeDefined();
      expect(clickHandler?.handler).toContain('async');
      expect(clickHandler?.handler).toContain('await');
    });

    it('should extract handler with destructured parameters', () => {
      const source = `
        function MyComponent() {
          const handleChange = ({ target: { value } }) => {
            console.log(value);
          };
          
          return <input onChange={handleChange} />;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const changeHandler = ir.nodes[0].events?.find(e => e.name === 'handleChange');
      expect(changeHandler).toBeDefined();
      expect(changeHandler?.parameters).toHaveLength(1);
      expect(changeHandler?.parameters[0].type).toBe('object');
    });

    it('should extract function reference handler', () => {
      const source = `
        function MyComponent() {
          const handleClick = () => console.log('clicked');
          return <button onClick={handleClick}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const clickEvent = ir.nodes[0].events?.find(e => e.name === 'onClick');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.handler).toBe('handleClick');
    });

    it('should extract member expression handler', () => {
      const source = `
        function MyComponent() {
          const handlers = {
            click: () => console.log('clicked')
          };
          return <button onClick={handlers.click}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      const clickEvent = ir.nodes[0].events?.find(e => e.name === 'onClick');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.handler).toBe('handlers.click');
    });
  });

  describe('Error Handling', () => {
    it('should throw on syntax error', () => {
      const source = `
        function MyComponent() {
          return <div>Unclosed div;
        }
      `;

      expect(() => parser.parse(source, 'test.tsx')).toThrow();
    });

    it('should throw on invalid JSX', () => {
      const source = `
        function MyComponent() {
          return <div><span></div></span>;
        }
      `;

      expect(() => parser.parse(source, 'test.tsx')).toThrow();
    });
  });

  describe('TypeScript Support', () => {
    it('should parse TypeScript component with type annotations', () => {
      const source = `
        interface Props {
          title: string;
          count: number;
        }
        
        function MyComponent({ title, count }: Props) {
          return <div>{title}: {count}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      expect((ir.metadata as any).typeDefinitions).toHaveLength(1);
      expect((ir.metadata as any).typeDefinitions[0].name).toBe('Props');
      expect((ir.metadata as any).typeDefinitions[0].kind).toBe('interface');
    });

    it('should parse generic components', () => {
      const source = `
        function MyComponent<T>({ items }: { items: T[] }) {
          return <div>{items.length}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
      expect((ir.nodes[0].metadata as any).genericParameters).toBeDefined();
      expect((ir.nodes[0].metadata as any).genericParameters).toContain('T');
    });

    it('should extract interface definitions', () => {
      const source = `
        interface User {
          id: number;
          name: string;
          email?: string;
          readonly createdAt: Date;
        }
        
        function UserCard({ user }: { user: User }) {
          return <div>{user.name}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      const userInterface = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'User');
      expect(userInterface).toBeDefined();
      expect(userInterface.kind).toBe('interface');
      expect(userInterface.properties).toHaveProperty('id');
      expect(userInterface.properties).toHaveProperty('name');
      expect(userInterface.properties).toHaveProperty('email');
      expect(userInterface.properties).toHaveProperty('createdAt');
    });

    it('should extract type aliases', () => {
      const source = `
        type Status = 'active' | 'inactive' | 'pending';
        type UserID = string | number;
        
        function StatusBadge({ status }: { status: Status }) {
          return <span>{status}</span>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      expect((ir.metadata as any).typeDefinitions).toHaveLength(2);
      
      const statusType = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'Status');
      expect(statusType).toBeDefined();
      expect(statusType.kind).toBe('type');
      
      const userIdType = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'UserID');
      expect(userIdType).toBeDefined();
      expect(userIdType.kind).toBe('type');
    });

    it('should extract enum declarations', () => {
      const source = `
        enum Color {
          Red = 'red',
          Green = 'green',
          Blue = 'blue'
        }
        
        function ColorPicker({ color }: { color: Color }) {
          return <div style={{ color }}>{color}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      const colorEnum = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'Color');
      expect(colorEnum).toBeDefined();
      expect(colorEnum.kind).toBe('enum');
      expect(colorEnum.members).toContain('Red');
      expect(colorEnum.members).toContain('Green');
      expect(colorEnum.members).toContain('Blue');
    });

    it('should handle type assertions', () => {
      const source = `
        function MyComponent() {
          const value = getValue() as string;
          const item = getItem()!;
          return <div>{value}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect(ir.nodes[0].type).toBe('MyComponent');
    });

    it('should handle generic type parameters with constraints', () => {
      const source = `
        interface HasId {
          id: number;
        }
        
        function ListComponent<T extends HasId>({ items }: { items: T[] }) {
          return <ul>{items.map(item => <li key={item.id}>{item.id}</li>)}</ul>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect((ir.nodes[0].metadata as any).genericParameters).toBeDefined();
      expect((ir.nodes[0].metadata as any).genericParameters).toContain('T');
    });

    it('should handle union and intersection types', () => {
      const source = `
        type StringOrNumber = string | number;
        type Combined = { a: string } & { b: number };
        
        function MyComponent({ value }: { value: StringOrNumber }) {
          return <div>{value}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      expect((ir.metadata as any).typeDefinitions).toHaveLength(2);
    });

    it('should handle array and tuple types', () => {
      const source = `
        type NumberArray = number[];
        type Tuple = [string, number, boolean];
        
        function MyComponent({ items }: { items: NumberArray }) {
          return <div>{items.length}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      const arrayType = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'NumberArray');
      expect(arrayType).toBeDefined();
    });

    it('should handle function types', () => {
      const source = `
        type Handler = (event: MouseEvent) => void;
        type AsyncHandler = (id: number) => Promise<string>;
        
        function MyComponent({ onClick }: { onClick: Handler }) {
          return <button onClick={onClick}>Click</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      expect((ir.metadata as any).typeDefinitions).toHaveLength(2);
    });

    it('should handle conditional types', () => {
      const source = `
        type IsString<T> = T extends string ? true : false;
        
        function MyComponent<T>({ value }: { value: T }) {
          return <div>{String(value)}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      const conditionalType = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'IsString');
      expect(conditionalType).toBeDefined();
    });

    it('should handle mapped types', () => {
      const source = `
        type Readonly<T> = {
          readonly [P in keyof T]: T[P];
        };
        
        function MyComponent<T>({ data }: { data: Readonly<T> }) {
          return <div>Component</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect((ir.metadata as any).typeDefinitions).toBeDefined();
      const mappedType = (ir.metadata as any).typeDefinitions.find((t: any) => t.name === 'Readonly');
      expect(mappedType).toBeDefined();
    });

    it('should preserve prop types from interfaces', () => {
      const source = `
        interface ButtonProps {
          label: string;
          onClick: () => void;
          disabled?: boolean;
        }
        
        function Button(props: ButtonProps) {
          return <button onClick={props.onClick} disabled={props.disabled}>{props.label}</button>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].props).toBeDefined();
      expect(ir.nodes[0].props.label).toBeDefined();
      expect(ir.nodes[0].props.label.type).toBe('string');
      expect(ir.nodes[0].props.onClick).toBeDefined();
      expect(ir.nodes[0].props.disabled).toBeDefined();
    });

    it('should handle inline type literals', () => {
      const source = `
        function MyComponent(props: { user: { id: number; name: string } }) {
          return <div>{props.user.name}</div>;
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes[0].props).toBeDefined();
      expect(ir.nodes[0].props.user).toBeDefined();
    });

    it('should handle decorators on class components', () => {
      const source = `
        function observable(target: any) {
          return target;
        }
        
        @observable
        class MyComponent extends React.Component {
          render() {
            return <div>Component</div>;
          }
        }
      `;

      const ir = parser.parse(source, 'test.tsx');

      expect(ir.nodes).toHaveLength(1);
      expect((ir.nodes[0].metadata as any).decorators).toBeDefined();
      expect((ir.nodes[0].metadata as any).decorators).toContain('@observable');
    });
  });
});
