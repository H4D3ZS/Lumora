/**
 * Performance tests for code generation
 * Verifies conversion speed meets performance targets
 */

const TSXParser = require('../src/tsx-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Code Generation Performance Tests', () => {
  let parser;
  let tempDir;

  beforeEach(() => {
    parser = new TSXParser();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumora-perf-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Single Component Conversion', () => {
    test('converts simple component within 500ms', () => {
      const code = `
        export default function App() {
          return <View><Text text="Hello" /></View>;
        }
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(schema).toBeDefined();
    });

    test('converts component with 50 elements within 500ms', () => {
      const children = Array.from({ length: 50 }, (_, i) => 
        `<Text text="Item ${i}" />`
      ).join('\n');

      const code = `
        export default function App() {
          return (
            <View>
              ${children}
            </View>
          );
        }
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(schema.children.length).toBe(50);
    });

    test('converts deeply nested component (10 levels) within 500ms', () => {
      let nested = '<Text text="Deep" />';
      for (let i = 0; i < 9; i++) {
        nested = `<View>${nested}</View>`;
      }

      const code = `export default function App() { return ${nested}; }`;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(schema).toBeDefined();
    });
  });

  describe('Project-Scale Conversion', () => {
    test('converts 100 components within 30 seconds', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const code = `
          export default function Component${i}() {
            return (
              <View>
                <Text text="Component ${i}" />
                <Button title="Click" />
              </View>
            );
          }
        `;

        const ast = parser.parseCode(code);
        const rootElement = parser.findRootJSXElement(ast);
        parser.convertToSchema(rootElement);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    });

    test('converts complex component with multiple features within 1 second', () => {
      const code = `
        export default function ComplexApp() {
          return (
            <View>
              <View>
                <Text text="Header" />
                <Button title="Menu" />
              </View>
              <List>
                ${Array.from({ length: 20 }, (_, i) => `
                  <View key={${i}}>
                    <Text text="Item ${i}" />
                    <Button title="Edit" />
                    <Button title="Delete" />
                  </View>
                `).join('\n')}
              </List>
              <View>
                <Input placeholder="Search" />
                <Button title="Search" />
              </View>
              <View>
                <Text text="Footer" />
              </View>
            </View>
          );
        }
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(schema).toBeDefined();
    });
  });

  describe('File I/O Performance', () => {
    test('reads and converts file within 500ms', () => {
      const code = `
        export default function App() {
          return (
            <View>
              <Text text="Hello World" />
              <Button title="Click Me" />
            </View>
          );
        }
      `;

      const filePath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');
      fs.writeFileSync(filePath, code, 'utf-8');

      const startTime = Date.now();
      parser.convertFileToSchema(filePath, schemaPath);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    test('converts and writes 10 files within 5 seconds', () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        const code = `
          export default function Component${i}() {
            return <View><Text text="Component ${i}" /></View>;
          }
        `;

        const filePath = path.join(tempDir, `component-${i}.tsx`);
        const schemaPath = path.join(tempDir, `schema-${i}.json`);
        
        fs.writeFileSync(filePath, code, 'utf-8');
        parser.convertFileToSchema(filePath, schemaPath);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Parsing Performance', () => {
    test('parses AST within 100ms', () => {
      const code = `
        export default function App() {
          return (
            <View>
              <Text text="Title" />
              <List>
                <Text text="Item 1" />
                <Text text="Item 2" />
                <Text text="Item 3" />
              </List>
              <Button title="Submit" />
            </View>
          );
        }
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(ast).toBeDefined();
    });

    test('finds root JSX element within 50ms', () => {
      const code = `
        export default function App() {
          return <View><Text text="Hello" /></View>;
        }
      `;

      const ast = parser.parseCode(code);

      const startTime = Date.now();
      const rootElement = parser.findRootJSXElement(ast);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(rootElement).toBeDefined();
    });
  });

  describe('Schema Generation Performance', () => {
    test('generates schema from AST within 200ms', () => {
      const code = `
        export default (
          <View>
            <Text text="Header" />
            <List>
              <Text text="Item 1" />
              <Text text="Item 2" />
              <Text text="Item 3" />
            </List>
            <Button title="Action" />
          </View>
        )
      `;

      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);

      const startTime = Date.now();
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
      expect(schema).toBeDefined();
    });

    test('handles large prop objects efficiently', () => {
      const code = `
        export default (
          <View style={{
            width: 100,
            height: 200,
            padding: 10,
            margin: 20,
            backgroundColor: "#ffffff",
            borderRadius: 5,
            borderWidth: 1,
            borderColor: "#000000",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <Text text="Styled" />
          </View>
        )
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      const schema = parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300);
      expect(schema.props.style).toBeDefined();
    });
  });

  describe('Memory Efficiency', () => {
    test('does not leak memory with repeated conversions', () => {
      const code = `
        export default function App() {
          return <View><Text text="Test" /></View>;
        }
      `;

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 1000 conversions
      for (let i = 0; i < 1000; i++) {
        const ast = parser.parseCode(code);
        const rootElement = parser.findRootJSXElement(ast);
        parser.convertToSchema(rootElement);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 1000 conversions)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Real-World Performance Targets', () => {
    test('meets target: single component < 500ms', () => {
      const code = `
        export default function TodoItem() {
          return (
            <View>
              <Text text="Buy groceries" />
              <Button title="Complete" />
            </View>
          );
        }
      `;

      const startTime = Date.now();
      const ast = parser.parseCode(code);
      const rootElement = parser.findRootJSXElement(ast);
      parser.convertToSchema(rootElement);
      const duration = Date.now() - startTime;

      // Requirement 16.1: Single component within 500ms
      expect(duration).toBeLessThan(500);
    });

    test('meets target: 100 components < 30 seconds', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const code = `
          export default function Component${i}() {
            return (
              <View>
                <Text text="Component ${i}" />
                <Button title="Action" />
              </View>
            );
          }
        `;

        const ast = parser.parseCode(code);
        const rootElement = parser.findRootJSXElement(ast);
        parser.convertToSchema(rootElement);
      }

      const duration = Date.now() - startTime;

      // Requirement 16.2: 100 components within 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });
});
