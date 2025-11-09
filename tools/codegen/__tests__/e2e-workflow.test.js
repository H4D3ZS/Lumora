const TSXParser = require('../src/tsx-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('End-to-End Workflow Tests', () => {
  let tempDir;
  let parser;

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumora-e2e-'));
    parser = new TSXParser();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Quick Start Flow', () => {
    test('converts simple TSX to schema', () => {
      // Step 1: Create TSX file
      const tsxContent = `
        export default function App() {
          return (
            <View>
              <Text text="Hello World" />
            </View>
          );
        }
      `;

      const tsxPath = path.join(tempDir, 'app.tsx');
      fs.writeFileSync(tsxPath, tsxContent, 'utf-8');

      // Step 2: Convert TSX to schema
      const schemaPath = path.join(tempDir, 'schema.json');
      const schema = parser.convertFileToSchema(tsxPath, schemaPath);

      // Step 3: Verify schema was created
      expect(fs.existsSync(schemaPath)).toBe(true);
      expect(schema.schemaVersion).toBe('1.0');
      expect(schema.root.type).toBe('View');
      expect(schema.root.children).toHaveLength(1);
      expect(schema.root.children[0].type).toBe('Text');
      expect(schema.root.children[0].props.text).toBe('Hello World');
    });

    test('verifies schema can be read and parsed', () => {
      // Create a schema file
      const schema = {
        schemaVersion: '1.0',
        root: {
          type: 'View',
          props: {},
          children: [
            {
              type: 'Text',
              props: { text: 'Test' },
              children: []
            }
          ]
        }
      };

      const schemaPath = path.join(tempDir, 'schema.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2), 'utf-8');

      // Read and parse the schema
      const readSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      expect(readSchema.schemaVersion).toBe('1.0');
      expect(readSchema.root.type).toBe('View');
    });
  });

  describe('Live Edit Flow', () => {
    test('modifies TSX and regenerates schema', () => {
      // Initial TSX
      const initialTSX = `
        export default function App() {
          return <Text text="Version 1" />;
        }
      `;

      const tsxPath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      // Generate initial schema
      fs.writeFileSync(tsxPath, initialTSX, 'utf-8');
      const schema1 = parser.convertFileToSchema(tsxPath, schemaPath);

      expect(schema1.root.props.text).toBe('Version 1');

      // Modify TSX
      const updatedTSX = `
        export default function App() {
          return <Text text="Version 2" />;
        }
      `;

      fs.writeFileSync(tsxPath, updatedTSX, 'utf-8');

      // Regenerate schema
      const schema2 = parser.convertFileToSchema(tsxPath, schemaPath);

      expect(schema2.root.props.text).toBe('Version 2');
    });

    test('handles incremental changes to component structure', () => {
      const tsxPath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      // Version 1: Single text
      fs.writeFileSync(tsxPath, `
        export default <Text text="Hello" />
      `, 'utf-8');

      const schema1 = parser.convertFileToSchema(tsxPath, schemaPath);
      expect(schema1.root.type).toBe('Text');

      // Version 2: Add container
      fs.writeFileSync(tsxPath, `
        export default (
          <View>
            <Text text="Hello" />
          </View>
        )
      `, 'utf-8');

      const schema2 = parser.convertFileToSchema(tsxPath, schemaPath);
      expect(schema2.root.type).toBe('View');
      expect(schema2.root.children).toHaveLength(1);

      // Version 3: Add more children
      fs.writeFileSync(tsxPath, `
        export default (
          <View>
            <Text text="Hello" />
            <Button title="Click" />
          </View>
        )
      `, 'utf-8');

      const schema3 = parser.convertFileToSchema(tsxPath, schemaPath);
      expect(schema3.root.children).toHaveLength(2);
    });
  });

  describe('Production Code Generation Flow', () => {
    test('generates schema from complete component', () => {
      const todoAppTSX = `
        export default function TodoApp() {
          return (
            <View>
              <Text text="My Todo List" />
              <List>
                <View>
                  <Text text="Buy groceries" />
                  <Button title="Complete" />
                </View>
                <View>
                  <Text text="Walk the dog" />
                  <Button title="Complete" />
                </View>
              </List>
              <Input placeholder="Add new todo" />
              <Button title="Add" />
            </View>
          );
        }
      `;

      const tsxPath = path.join(tempDir, 'todo-app.tsx');
      const schemaPath = path.join(tempDir, 'todo-schema.json');

      fs.writeFileSync(tsxPath, todoAppTSX, 'utf-8');
      const schema = parser.convertFileToSchema(tsxPath, schemaPath);

      // Verify complete structure
      expect(schema.root.type).toBe('View');
      expect(schema.root.children.length).toBeGreaterThan(0);

      // Verify title
      expect(schema.root.children[0].type).toBe('Text');
      expect(schema.root.children[0].props.text).toBe('My Todo List');

      // Verify list exists
      const listNode = schema.root.children.find(child => child.type === 'List');
      expect(listNode).toBeDefined();
      expect(listNode.children.length).toBeGreaterThan(0);

      // Verify input and button
      const inputNode = schema.root.children.find(child => child.type === 'Input');
      const buttonNode = schema.root.children.find(child => child.type === 'Button');
      expect(inputNode).toBeDefined();
      expect(buttonNode).toBeDefined();
    });

    test('schema is valid JSON and can be serialized', () => {
      const tsxContent = `
        export default (
          <View>
            <Text text="Test" />
          </View>
        )
      `;

      const tsxPath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      fs.writeFileSync(tsxPath, tsxContent, 'utf-8');
      parser.convertFileToSchema(tsxPath, schemaPath);

      // Read the file and verify it's valid JSON
      const fileContent = fs.readFileSync(schemaPath, 'utf-8');
      const parsedSchema = JSON.parse(fileContent);

      expect(parsedSchema).toBeDefined();
      expect(parsedSchema.schemaVersion).toBe('1.0');

      // Verify it can be re-serialized
      const reserializedSchema = JSON.stringify(parsedSchema);
      expect(reserializedSchema).toBeTruthy();
    });
  });

  describe('Performance Benchmarks', () => {
    test('schema generation completes quickly for small components', () => {
      const tsxContent = `
        export default <View><Text text="Hello" /></View>
      `;

      const tsxPath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      fs.writeFileSync(tsxPath, tsxContent, 'utf-8');

      const startTime = Date.now();
      parser.convertFileToSchema(tsxPath, schemaPath);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete in less than 100ms for small components
      expect(duration).toBeLessThan(100);
    });

    test('handles moderately complex components efficiently', () => {
      // Generate a component with 50 elements
      const children = Array.from({ length: 50 }, (_, i) => 
        `<Text text="Item ${i}" />`
      ).join('\n');

      const tsxContent = `
        export default function App() {
          return (
            <List>
              ${children}
            </List>
          );
        }
      `;

      const tsxPath = path.join(tempDir, 'app.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      fs.writeFileSync(tsxPath, tsxContent, 'utf-8');

      const startTime = Date.now();
      const schema = parser.convertFileToSchema(tsxPath, schemaPath);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete in less than 500ms for moderate complexity
      expect(duration).toBeLessThan(500);
      expect(schema.root.children).toHaveLength(50);
    });
  });

  describe('Error Recovery', () => {
    test('provides clear error for invalid TSX syntax', () => {
      const invalidTSX = `
        export default function App() {
          return <View>
        }
      `;

      const tsxPath = path.join(tempDir, 'invalid.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      fs.writeFileSync(tsxPath, invalidTSX, 'utf-8');

      expect(() => {
        parser.convertFileToSchema(tsxPath, schemaPath);
      }).toThrow();
    });

    test('handles missing JSX element gracefully', () => {
      const noJSX = `
        export default function App() {
          return null;
        }
      `;

      const tsxPath = path.join(tempDir, 'no-jsx.tsx');
      const schemaPath = path.join(tempDir, 'schema.json');

      fs.writeFileSync(tsxPath, noJSX, 'utf-8');

      expect(() => {
        parser.convertFileToSchema(tsxPath, schemaPath);
      }).toThrow(/No JSX element found/);
    });
  });

  describe('Real-World Scenarios', () => {
    test('converts chat app component', () => {
      const chatAppTSX = `
        export default function ChatApp() {
          return (
            <View>
              <Text text="Chat Room" />
              <List>
                <View>
                  <Text text="Alice: Hello!" />
                </View>
                <View>
                  <Text text="Bob: Hi there!" />
                </View>
              </List>
              <View>
                <Input placeholder="Type a message..." />
                <Button title="Send" />
              </View>
            </View>
          );
        }
      `;

      const tsxPath = path.join(tempDir, 'chat-app.tsx');
      const schemaPath = path.join(tempDir, 'chat-schema.json');

      fs.writeFileSync(tsxPath, chatAppTSX, 'utf-8');
      const schema = parser.convertFileToSchema(tsxPath, schemaPath);

      expect(schema.root.type).toBe('View');
      expect(schema.root.children.length).toBeGreaterThan(0);

      // Verify chat messages list
      const listNode = schema.root.children.find(child => child.type === 'List');
      expect(listNode).toBeDefined();
      expect(listNode.children.length).toBeGreaterThan(0);
    });

    test('converts form component with multiple inputs', () => {
      const formTSX = `
        export default function SignupForm() {
          return (
            <View>
              <Text text="Sign Up" />
              <Input placeholder="Email" />
              <Input placeholder="Password" />
              <Input placeholder="Confirm Password" />
              <Button title="Create Account" />
            </View>
          );
        }
      `;

      const tsxPath = path.join(tempDir, 'form.tsx');
      const schemaPath = path.join(tempDir, 'form-schema.json');

      fs.writeFileSync(tsxPath, formTSX, 'utf-8');
      const schema = parser.convertFileToSchema(tsxPath, schemaPath);

      // Count input fields
      const inputCount = schema.root.children.filter(child => child.type === 'Input').length;
      expect(inputCount).toBe(3);

      // Verify button
      const button = schema.root.children.find(child => child.type === 'Button');
      expect(button).toBeDefined();
      expect(button.props.title).toBe('Create Account');
    });
  });
});
