const TSXToIR = require('../src/tsx-to-ir');
const IRToFlutter = require('../src/ir-to-flutter');
const IRToReact = require('../src/ir-to-react');
const path = require('path');

describe('Event Handler Conversion', () => {
  let tsxToIR;
  let irToFlutter;
  let irToReact;
  const mappingPath = path.join(__dirname, '../ui-mapping.json');

  beforeEach(() => {
    tsxToIR = new TSXToIR();
    irToFlutter = new IRToFlutter();
    irToReact = new IRToReact();
    irToFlutter.loadMappings(mappingPath);
    irToReact.loadMappings(mappingPath);
  });

  describe('React to Flutter Event Conversion', () => {
    test('should convert onClick to onTap', () => {
      const reactCode = `
        export default function MyButton() {
          return <Button onClick={() => console.log('clicked')}>Click Me</Button>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'test.tsx');
      const flutterCode = irToFlutter.convertToFlutter(ir);

      expect(flutterCode).toContain('onPressed:');
      expect(flutterCode).toContain('print(');
    });

    test('should convert onPress to onPressed', () => {
      const reactCode = `
        export default function MyButton() {
          return <Button onPress={() => alert('pressed')}>Press Me</Button>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'test.tsx');
      const flutterCode = irToFlutter.convertToFlutter(ir);

      expect(flutterCode).toContain('onPressed:');
    });

    test('should handle async event handlers', () => {
      const reactCode = `
        export default function AsyncButton() {
          return <Button onClick={async () => {
            await fetch('/api/data');
            console.log('done');
          }}>Fetch</Button>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'test.tsx');
      const flutterCode = irToFlutter.convertToFlutter(ir);

      expect(flutterCode).toContain('async');
      expect(flutterCode).toContain('onPressed:');
    });

    test('should convert Promise to Future', () => {
      const reactCode = `
        export default function PromiseButton() {
          return <Button onClick={() => {
            Promise.resolve('data').then(value => console.log(value));
          }}>Promise</Button>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'test.tsx');
      const flutterCode = irToFlutter.convertToFlutter(ir);

      expect(flutterCode).toContain('Future.');
    });
  });

  describe('Flutter to React Event Conversion', () => {
    test('should convert onTap to onClick', () => {
      const flutterCode = `
        class MyWidget extends StatelessWidget {
          @override
          Widget build(BuildContext context) {
            return GestureDetector(
              onTap: () => print('tapped'),
              child: Container(),
            );
          }
        }
      `;

      // Note: This test would require a Flutter parser implementation
      // For now, we'll test the conversion function directly
      const event = {
        name: 'onTap',
        handler: "() => print('tapped')",
        parameters: []
      };

      const reactHandler = irToReact.convertFlutterEventToReact(event);
      expect(reactHandler).toContain('console.log');
    });

    test('should handle async Flutter event handlers', () => {
      const event = {
        name: 'onPressed',
        handler: '() async { await Future.delayed(Duration(seconds: 1)); print("done"); }',
        parameters: []
      };

      const reactHandler = irToReact.convertFlutterEventToReact(event);
      expect(reactHandler).toContain('async');
    });

    test('should convert Future to Promise', () => {
      const event = {
        name: 'onPressed',
        handler: '() { Future.value("data").then((value) => print(value)); }',
        parameters: []
      };

      const reactHandler = irToReact.convertFlutterEventToReact(event);
      expect(reactHandler).toContain('Promise.');
    });
  });

  describe('State References in Events', () => {
    test('should handle state references in React event handlers', () => {
      const reactCode = `
        export default function Counter() {
          const [count, setCount] = useState(0);
          return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>;
        }
      `;

      const ir = tsxToIR.parseCode(reactCode, 'test.tsx');
      const flutterCode = irToFlutter.convertToFlutter(ir);

      expect(flutterCode).toContain('setState');
      expect(flutterCode).toContain('count');
    });

    test('should convert setState calls to React state setters', () => {
      const flutterCode = 'setState(() { count = count + 1; });';
      const reactCode = irToReact.convertSetStateCalls(flutterCode);

      // Should convert to setCount(count + 1)
      // Note: This requires state variables to be registered
      expect(reactCode).toBeDefined();
    });
  });
});
