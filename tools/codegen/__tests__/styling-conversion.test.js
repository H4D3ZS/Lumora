const TSXToIR = require('../src/tsx-to-ir');
const IRToFlutter = require('../src/ir-to-flutter');
const IRToReact = require('../src/ir-to-react');
const path = require('path');

describe('Styling Conversion', () => {
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

  describe('React to Flutter Style Conversion', () => {
    test('should convert backgroundColor to BoxDecoration color', () => {
      const tsxCode = `
        export default function StyledComponent() {
          return (
            <div style={{ backgroundColor: '#FF5733' }}>
              <span>Styled Text</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('BoxDecoration');
      expect(dartCode).toContain('Color(0xFFFF5733)');
    });

    test('should convert padding to EdgeInsets', () => {
      const tsxCode = `
        export default function PaddedComponent() {
          return (
            <div style={{ padding: 16 }}>
              <span>Padded Text</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('EdgeInsets.all(16)');
    });

    test('should convert complex padding to EdgeInsets.only', () => {
      const tsxCode = `
        export default function ComplexPadding() {
          return (
            <div style={{ paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20 }}>
              <span>Complex Padding</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('EdgeInsets');
    });

    test('should convert text styles to TextStyle', () => {
      const tsxCode = `
        export default function StyledText() {
          return (
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#333333' }}>
              Styled Text
            </span>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('TextStyle');
      expect(dartCode).toContain('fontSize: 18');
      expect(dartCode).toContain('FontWeight.bold');
      expect(dartCode).toContain('Color(0xFF333333)');
    });

    test('should convert rgba colors to Flutter Color', () => {
      const tsxCode = `
        export default function RgbaColor() {
          return (
            <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.5)' }}>
              <span>Semi-transparent Red</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('Color(0x');
    });

    test('should convert flexbox to Row/Column', () => {
      const tsxCode = `
        export default function FlexLayout() {
          return (
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <span>Item 1</span>
              <span>Item 2</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('Row');
      expect(dartCode).toContain('MainAxisAlignment.center');
      expect(dartCode).toContain('CrossAxisAlignment.center');
    });

    test('should convert flexDirection column to Column widget', () => {
      const tsxCode = `
        export default function ColumnLayout() {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span>Item 1</span>
              <span>Item 2</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('Column');
    });

    test('should convert borderRadius to BorderRadius.circular', () => {
      const tsxCode = `
        export default function RoundedBox() {
          return (
            <div style={{ borderRadius: 10, backgroundColor: '#FFFFFF' }}>
              <span>Rounded Box</span>
            </div>
          );
        }
      `;

      const ir = tsxToIR.parseCode(tsxCode);
      const dartCode = irToFlutter.convertToFlutter(ir);

      expect(dartCode).toContain('BorderRadius.circular(10)');
    });
  });

  describe('Flutter to React Style Conversion', () => {
    test('should convert BoxDecoration color to backgroundColor', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'StyledWidget'
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {
            style: {
              backgroundColor: 'Color(0xFFFF5733)'
            }
          },
          children: [{
            id: 'node2',
            type: 'Text',
            props: { text: 'Styled Text' },
            children: [],
            metadata: { lineNumber: 1 }
          }],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('backgroundColor');
      expect(reactCode).toContain('#FF5733');
    });

    test('should convert EdgeInsets to CSS padding', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'PaddedWidget'
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {
            padding: 'EdgeInsets.all(16)'
          },
          children: [{
            id: 'node2',
            type: 'Text',
            props: { text: 'Padded Text' },
            children: [],
            metadata: { lineNumber: 1 }
          }],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('padding');
      expect(reactCode).toContain('16px');
    });

    test('should convert TextStyle to React text styles', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'StyledText'
        },
        nodes: [{
          id: 'node1',
          type: 'Text',
          props: {
            text: 'Styled Text',
            style: {
              fontSize: 18,
              fontWeight: 'FontWeight.bold',
              color: 'Color(0xFF333333)'
            }
          },
          children: [],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('fontSize');
      expect(reactCode).toContain('18px');
      expect(reactCode).toContain('fontWeight');
      expect(reactCode).toContain('bold');
      expect(reactCode).toContain('color');
      expect(reactCode).toContain('#333333');
    });

    test('should convert Row to flexbox with flexDirection row', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'RowWidget'
        },
        nodes: [{
          id: 'node1',
          type: 'Row',
          props: {
            mainAxisAlignment: 'MainAxisAlignment.center',
            crossAxisAlignment: 'CrossAxisAlignment.center'
          },
          children: [
            {
              id: 'node2',
              type: 'Text',
              props: { text: 'Item 1' },
              children: [],
              metadata: { lineNumber: 1 }
            },
            {
              id: 'node3',
              type: 'Text',
              props: { text: 'Item 2' },
              children: [],
              metadata: { lineNumber: 1 }
            }
          ],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('display: \'flex\'');
      expect(reactCode).toContain('flexDirection: \'row\'');
      expect(reactCode).toContain('justifyContent: \'center\'');
      expect(reactCode).toContain('alignItems: \'center\'');
    });

    test('should convert Column to flexbox with flexDirection column', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'ColumnWidget'
        },
        nodes: [{
          id: 'node1',
          type: 'Column',
          props: {},
          children: [
            {
              id: 'node2',
              type: 'Text',
              props: { text: 'Item 1' },
              children: [],
              metadata: { lineNumber: 1 }
            },
            {
              id: 'node3',
              type: 'Text',
              props: { text: 'Item 2' },
              children: [],
              metadata: { lineNumber: 1 }
            }
          ],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('display: \'flex\'');
      expect(reactCode).toContain('flexDirection: \'column\'');
    });

    test('should convert Colors.red to hex color', () => {
      const ir = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
          componentName: 'RedWidget'
        },
        nodes: [{
          id: 'node1',
          type: 'Container',
          props: {
            style: {
              backgroundColor: 'Colors.red'
            }
          },
          children: [],
          metadata: { lineNumber: 1 }
        }]
      };

      const reactCode = irToReact.convertToReact(ir);

      expect(reactCode).toContain('backgroundColor');
      expect(reactCode).toContain('#F44336');
    });
  });

  describe('Color Conversion', () => {
    test('should handle 3-digit hex colors', () => {
      const color = irToFlutter.convertColor('#F00');
      expect(color).toBe('Color(0xFFFF0000)');
    });

    test('should handle 6-digit hex colors', () => {
      const color = irToFlutter.convertColor('#FF5733');
      expect(color).toBe('Color(0xFFFF5733)');
    });

    test('should handle 8-digit hex colors with alpha', () => {
      const color = irToFlutter.convertColor('#80FF5733');
      expect(color).toBe('Color(0x80FF5733)');
    });

    test('should handle named colors', () => {
      const color = irToFlutter.convertColor('red');
      expect(color).toBe('Colors.red');
    });

    test('should handle rgb colors', () => {
      const color = irToFlutter.convertColor('rgb(255, 87, 51)');
      expect(color).toContain('Color(0x');
    });

    test('should handle rgba colors', () => {
      const color = irToFlutter.convertColor('rgba(255, 87, 51, 0.5)');
      expect(color).toContain('Color(0x');
    });
  });

  describe('Dimension Conversion', () => {
    test('should convert numeric dimensions', () => {
      const dimension = irToFlutter.convertDimension(100);
      expect(dimension).toBe(100);
    });

    test('should convert string dimensions with px', () => {
      const dimension = irToFlutter.convertDimension('100px');
      expect(dimension).toBe(100);
    });

    test('should handle invalid dimensions', () => {
      const dimension = irToFlutter.convertDimension('invalid');
      expect(dimension).toBe(0);
    });
  });

  describe('EdgeInsets Conversion', () => {
    test('should convert uniform padding to EdgeInsets.all', () => {
      const edgeInsets = irToFlutter.convertPaddingToEdgeInsets(16);
      expect(edgeInsets).toBe('EdgeInsets.all(16)');
    });

    test('should convert symmetric padding to EdgeInsets.symmetric', () => {
      const edgeInsets = irToFlutter.convertPaddingToEdgeInsets({
        top: 10,
        bottom: 10,
        left: 20,
        right: 20
      });
      expect(edgeInsets).toBe('EdgeInsets.symmetric(vertical: 10, horizontal: 20)');
    });

    test('should convert different padding to EdgeInsets.only', () => {
      const edgeInsets = irToFlutter.convertPaddingToEdgeInsets({
        top: 10,
        right: 20,
        bottom: 30,
        left: 40
      });
      expect(edgeInsets).toBe('EdgeInsets.only(top: 10, right: 20, bottom: 30, left: 40)');
    });
  });

  describe('Flexbox Conversion', () => {
    test('should convert justifyContent to MainAxisAlignment', () => {
      const alignment = irToFlutter.convertJustifyContent('center');
      expect(alignment).toBe('MainAxisAlignment.center');
    });

    test('should convert space-between to MainAxisAlignment.spaceBetween', () => {
      const alignment = irToFlutter.convertJustifyContent('space-between');
      expect(alignment).toBe('MainAxisAlignment.spaceBetween');
    });

    test('should convert alignItems to CrossAxisAlignment', () => {
      const alignment = irToFlutter.convertAlignItems('center');
      expect(alignment).toBe('CrossAxisAlignment.center');
    });

    test('should convert stretch to CrossAxisAlignment.stretch', () => {
      const alignment = irToFlutter.convertAlignItems('stretch');
      expect(alignment).toBe('CrossAxisAlignment.stretch');
    });
  });
});
