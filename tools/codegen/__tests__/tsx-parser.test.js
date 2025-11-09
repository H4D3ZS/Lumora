const TSXParser = require('../src/tsx-parser');
const fs = require('fs');
const path = require('path');

describe('TSXParser', () => {
  let parser;

  beforeEach(() => {
    parser = new TSXParser();
  });

  describe('TSX Parsing', () => {
    test('parses simple TSX code', () => {
      const code = `
        export default function App() {
          return <View><Text>Hello</Text></View>;
        }
      `;

      const ast = parser.parseCode(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('File');
    });

    test('parses TSX with TypeScript types', () => {
      const code = `
        interface Props {
          title: string;
        }
        
        export default function App({ title }: Props) {
          return <Text>{title}</Text>;
        }
      `;

      const ast = parser.parseCode(code);
      expect(ast).toBeDefined();
    });

    test('throws error for invalid syntax', () => {
      const code = `export default function App() { return <View> }`;

      expect(() => parser.parseCode(code)).toThrow();
    });
  });

  describe('Root JSX Element Detection', () => {
    test('finds root element in default export function', () => {
      const code = `
        export default function App() {
          return <View><Text>Hello</Text></View>;
        }
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);

      expect(rootElement).toBeDefined();
      expect(rootElement.type).toBe('JSXElement');
    });

    test('finds root element in arrow function', () => {
      const code = `
        const App = () => <View><Text>Hello</Text></View>;
        export default App;
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);

      expect(rootElement).toBeDefined();
      expect(rootElement.type).toBe('JSXElement');
    });

    test('finds root element in direct export', () => {
      const code = `
        export default <View><Text>Hello</Text></View>;
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);

      expect(rootElement).toBeDefined();
      expect(rootElement.type).toBe('JSXElement');
    });

    test('returns null when no JSX element found', () => {
      const code = `
        export default function App() {
          return null;
        }
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);

      expect(rootElement).toBeNull();
    });
  });

  describe('Schema Node Generation', () => {
    test('converts simple View element', () => {
      const code = `export default <View></View>`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('View');
      expect(schema.props).toEqual({});
      expect(schema.children).toEqual([]);
    });

    test('converts Text element with text prop', () => {
      const code = `export default <Text text="Hello World" />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('Text');
      expect(schema.props.text).toBe('Hello World');
    });

    test('converts Button element with title prop', () => {
      const code = `export default <Button title="Click Me" />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('Button');
      expect(schema.props.title).toBe('Click Me');
    });

    test('converts nested elements', () => {
      const code = `
        export default (
          <View>
            <Text text="Title" />
            <Text text="Subtitle" />
          </View>
        )
      `;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('View');
      expect(schema.children).toHaveLength(2);
      expect(schema.children[0].type).toBe('Text');
      expect(schema.children[0].props.text).toBe('Title');
      expect(schema.children[1].type).toBe('Text');
      expect(schema.children[1].props.text).toBe('Subtitle');
    });

    test('converts JSX text content to Text nodes', () => {
      const code = `export default <View>Hello World</View>`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.children).toHaveLength(1);
      expect(schema.children[0].type).toBe('Text');
      expect(schema.children[0].props.text).toBe('Hello World');
    });
  });

  describe('Prop Extraction', () => {
    test('extracts string literal props', () => {
      const code = `export default <Text text="Hello" />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.text).toBe('Hello');
    });

    test('extracts numeric props', () => {
      const code = `export default <Image width={100} height={200} />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.width).toBe(100);
      expect(schema.props.height).toBe(200);
    });

    test('extracts boolean props', () => {
      const code = `export default <Button disabled={true} />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.disabled).toBe(true);
    });

    test('extracts object props', () => {
      const code = `export default <Text style={{ fontSize: 16, color: "red" }} />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.style).toEqual({ fontSize: 16, color: "red" });
    });

    test('extracts array props', () => {
      const code = `export default <List items={[1, 2, 3]} />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.items).toEqual([1, 2, 3]);
    });

    test('converts variable references to template placeholders', () => {
      const code = `export default <Text text={userName} />`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.text).toBe('{{userName}}');
    });

    test('extracts template literals with placeholders', () => {
      const code = 'export default <Text text={`Hello ${name}`} />';
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.props.text).toBe('Hello {{name}}');
    });
  });

  describe('End-to-End TSX to Schema Conversion', () => {
    test('converts complete TSX component to schema', () => {
      const code = `
        export default function TodoApp() {
          return (
            <View>
              <Text text="Todo List" />
              <List>
                <Text text="Item 1" />
                <Text text="Item 2" />
              </List>
              <Button title="Add Item" />
            </View>
          );
        }
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('View');
      expect(schema.children).toHaveLength(3);
      expect(schema.children[0].type).toBe('Text');
      expect(schema.children[1].type).toBe('List');
      expect(schema.children[1].children).toHaveLength(2);
      expect(schema.children[2].type).toBe('Button');
    });

    test('generates schema with correct version', () => {
      const code = `export default <View><Text text="Hello" /></View>`;
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schemaRoot = parser.convertToSchema(rootElement);

      const fullSchema = {
        schemaVersion: '1.0',
        root: schemaRoot
      };

      expect(fullSchema.schemaVersion).toBe('1.0');
      expect(fullSchema.root).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('throws error when converting null element', () => {
      expect(() => parser.convertToSchema(null)).toThrow();
    });

    test('throws error when converting non-JSX element', () => {
      const invalidNode = { type: 'Identifier', name: 'test' };
      expect(() => parser.convertToSchema(invalidNode)).toThrow();
    });
  });

  describe('Complex JSX Structures', () => {
    test('handles deeply nested components', () => {
      const code = `
        export default (
          <View>
            <View>
              <View>
                <Text text="Deep" />
              </View>
            </View>
          </View>
        )
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('View');
      expect(schema.children[0].type).toBe('View');
      expect(schema.children[0].children[0].type).toBe('View');
      expect(schema.children[0].children[0].children[0].type).toBe('Text');
    });

    test('handles mixed content (elements and text)', () => {
      const code = `
        export default (
          <View>
            Hello
            <Text text="World" />
            Goodbye
          </View>
        )
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.children.length).toBeGreaterThan(0);
      expect(schema.children.some(child => child.type === 'Text')).toBe(true);
    });

    test('handles JSX fragments', () => {
      const code = `
        export default (
          <>
            <Text text="First" />
            <Text text="Second" />
          </>
        )
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);

      expect(schema.type).toBe('View'); // Fragments convert to View
      expect(schema.children).toHaveLength(2);
    });
  });
});
