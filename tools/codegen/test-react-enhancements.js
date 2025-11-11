/**
 * Test script for React code generator enhancements
 * Tests code quality improvements, optimizations, and proper hooks generation
 */

const IRToReact = require('./src/ir-to-react');
const path = require('path');

// Test IR with state and lifecycle
const testIR = {
  version: '1.0',
  metadata: {
    componentName: 'TestComponent',
    sourceFramework: 'flutter',
    sourceFile: 'test_widget.dart',
    documentation: 'A test component for verifying React code generation',
    generatedAt: Date.now(),
    flutter: {
      stateVariables: [
        {
          name: 'counter',
          type: 'number',
          dartType: 'int',
          initialValue: 0,
          fromFlutter: true
        },
        {
          name: 'message',
          type: 'string',
          dartType: 'String',
          initialValue: 'Hello',
          fromFlutter: true
        }
      ],
      lifecycleMethods: [
        {
          type: 'mount',
          body: 'console.log("Component mounted");'
        },
        {
          type: 'cleanup',
          body: 'console.log("Component unmounting");'
        }
      ],
      eventHandlers: [
        {
          name: 'handleIncrement',
          body: 'setCounter(counter + 1);',
          hasSetState: true
        }
      ]
    }
  },
  nodes: [
    {
      type: 'Container',
      props: {
        padding: 'EdgeInsets.all(16)',
        backgroundColor: 'Colors.white'
      },
      children: [
        {
          type: 'Text',
          props: {
            text: 'Counter: {{counter}}',
            style: {
              fontSize: 24,
              fontWeight: 'FontWeight.bold'
            }
          },
          children: []
        },
        {
          type: 'ElevatedButton',
          props: {
            title: 'Increment'
          },
          events: [
            {
              name: 'onPressed',
              handler: 'handleIncrement'
            }
          ],
          children: []
        }
      ]
    }
  ]
};

console.log('Testing React Code Generator Enhancements...\n');

try {
  // Create converter instance
  const converter = new IRToReact();
  
  // Load widget mappings
  const mappingPath = path.join(__dirname, 'ui-mapping.json');
  converter.loadMappings(mappingPath);
  
  // Convert IR to React
  console.log('Converting IR to React TypeScript...');
  const reactCode = converter.convertToReact(testIR);
  
  console.log('\n=== Generated React Code ===\n');
  console.log(reactCode);
  console.log('\n=== End of Generated Code ===\n');
  
  // Verify enhancements
  console.log('Verifying enhancements:');
  
  // Check for JSDoc comments
  if (reactCode.includes('/**') && reactCode.includes('* @param')) {
    console.log('✓ JSDoc comments present');
  } else {
    console.log('✗ Missing JSDoc comments');
  }
  
  // Check for helpful inline comments
  if (reactCode.includes('// State management') || reactCode.includes('// Effect:')) {
    console.log('✓ Helpful inline comments present');
  } else {
    console.log('✗ Missing helpful comments');
  }
  
  // Check for proper useState usage
  if (reactCode.includes('useState<number>') && reactCode.includes('useState<string>')) {
    console.log('✓ Proper TypeScript typing in useState');
  } else {
    console.log('✗ Missing proper TypeScript types');
  }
  
  // Check for useEffect with proper dependencies
  if (reactCode.includes('useEffect(() => {') && reactCode.includes('], []')) {
    console.log('✓ useEffect hooks with dependency arrays');
  } else {
    console.log('✗ Missing proper useEffect hooks');
  }
  
  // Check for useCallback
  if (reactCode.includes('useCallback')) {
    console.log('✓ useCallback for event handlers');
  } else {
    console.log('✗ Missing useCallback optimization');
  }
  
  // Check for proper formatting
  if (!reactCode.includes('  =  ') && !reactCode.includes(',  ')) {
    console.log('✓ Proper code formatting');
  } else {
    console.log('✗ Formatting issues detected');
  }
  
  // Check for React best practices comments
  if (reactCode.includes('Following React hooks rules')) {
    console.log('✓ React best practices comments');
  } else {
    console.log('✗ Missing best practices comments');
  }
  
  console.log('\n✓ Test completed successfully!');
  
} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
