"use strict";
/**
 * Mock Converter
 * Converts mock definitions between React and Flutter test frameworks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockConverter = void 0;
class MockConverter {
    /**
     * Convert React mock to Flutter mock
     */
    convertReactMockToFlutter(mock) {
        const lines = [];
        // Generate mock class
        lines.push(`class Mock${mock.name} extends Mock implements ${mock.type} {`);
        // Generate mock methods
        if (mock.methods && mock.methods.length > 0) {
            mock.methods.forEach(method => {
                const flutterMethod = this.generateFlutterMockMethod(method);
                lines.push(`  ${flutterMethod}`);
            });
        }
        lines.push(`}`);
        return lines.join('\n');
    }
    /**
     * Convert Flutter mock to React mock
     */
    convertFlutterMockToReact(mock) {
        const lines = [];
        // Generate Jest mock
        lines.push(`const mock${mock.name} = {`);
        // Generate mock methods
        if (mock.methods && mock.methods.length > 0) {
            mock.methods.forEach(method => {
                const jestMethod = this.generateJestMockMethod(method);
                lines.push(`  ${jestMethod},`);
            });
        }
        lines.push(`};`);
        return lines.join('\n');
    }
    /**
     * Generate Flutter mock method
     */
    generateFlutterMockMethod(method) {
        const params = method.parameters
            ? method.parameters.map(p => `${p.type} ${p.name}`).join(', ')
            : '';
        const returnType = this.inferFlutterReturnType(method.returnValue);
        if (method.implementation) {
            return `@override\n  ${returnType} ${method.name}(${params}) => ${method.implementation};`;
        }
        return `@override\n  ${returnType} ${method.name}(${params}) => noSuchMethod(Invocation.method(#${method.name}, [${params}]));`;
    }
    /**
     * Generate Jest mock method
     */
    generateJestMockMethod(method) {
        if (method.implementation) {
            return `${method.name}: jest.fn(${method.implementation})`;
        }
        if (method.returnValue !== undefined) {
            return `${method.name}: jest.fn().mockReturnValue(${JSON.stringify(method.returnValue)})`;
        }
        return `${method.name}: jest.fn()`;
    }
    /**
     * Infer Flutter return type from value
     */
    inferFlutterReturnType(value) {
        if (value === undefined || value === null) {
            return 'void';
        }
        if (typeof value === 'string') {
            return 'String';
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'int' : 'double';
        }
        if (typeof value === 'boolean') {
            return 'bool';
        }
        if (Array.isArray(value)) {
            return 'List<dynamic>';
        }
        return 'dynamic';
    }
    /**
     * Parse React Jest mock
     */
    parseReactMock(content) {
        const mocks = [];
        // Match jest.fn() patterns
        const fnRegex = /const\s+(\w+)\s*=\s*jest\.fn\(\)/g;
        let match;
        while ((match = fnRegex.exec(content)) !== null) {
            mocks.push({
                name: match[1],
                type: 'Function',
                methods: [],
            });
        }
        // Match jest.mock() patterns
        const mockRegex = /jest\.mock\(['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\({([^}]+)}\)/g;
        while ((match = mockRegex.exec(content)) !== null) {
            const moduleName = match[1].split('/').pop() || 'Unknown';
            mocks.push({
                name: moduleName,
                type: moduleName,
                methods: [],
            });
        }
        return mocks;
    }
    /**
     * Parse Flutter mock
     */
    parseFlutterMock(content) {
        const mocks = [];
        // Match Mock class definitions
        const mockRegex = /class\s+Mock(\w+)\s+extends\s+Mock\s+implements\s+(\w+)/g;
        let match;
        while ((match = mockRegex.exec(content)) !== null) {
            mocks.push({
                name: match[1],
                type: match[2],
                methods: [],
            });
        }
        return mocks;
    }
    /**
     * Generate mock setup code for React
     */
    generateReactMockSetup(mocks) {
        const lines = [];
        mocks.forEach(mock => {
            if (mock.methods && mock.methods.length > 0) {
                lines.push(`// Setup ${mock.name} mock`);
                mock.methods.forEach(method => {
                    if (method.returnValue !== undefined) {
                        lines.push(`${mock.name}.${method.name}.mockReturnValue(${JSON.stringify(method.returnValue)});`);
                    }
                });
                lines.push('');
            }
        });
        return lines.join('\n');
    }
    /**
     * Generate mock setup code for Flutter
     */
    generateFlutterMockSetup(mocks) {
        const lines = [];
        mocks.forEach(mock => {
            lines.push(`// Setup ${mock.name} mock`);
            lines.push(`final mock${mock.name} = Mock${mock.name}();`);
            if (mock.methods && mock.methods.length > 0) {
                mock.methods.forEach(method => {
                    if (method.returnValue !== undefined) {
                        lines.push(`when(mock${mock.name}.${method.name}()).thenReturn(${JSON.stringify(method.returnValue)});`);
                    }
                });
            }
            lines.push('');
        });
        return lines.join('\n');
    }
    /**
     * Convert Jest spy to Flutter verify
     */
    convertSpyToVerify(spyCall) {
        // Convert: expect(mockFn).toHaveBeenCalled()
        // To: verify(mockFn()).called(1)
        const calledMatch = spyCall.match(/expect\(([^)]+)\)\.toHaveBeenCalled\(\)/);
        if (calledMatch) {
            return `verify(${calledMatch[1]}()).called(1);`;
        }
        const calledTimesMatch = spyCall.match(/expect\(([^)]+)\)\.toHaveBeenCalledTimes\((\d+)\)/);
        if (calledTimesMatch) {
            return `verify(${calledTimesMatch[1]}()).called(${calledTimesMatch[2]});`;
        }
        const calledWithMatch = spyCall.match(/expect\(([^)]+)\)\.toHaveBeenCalledWith\(([^)]+)\)/);
        if (calledWithMatch) {
            return `verify(${calledWithMatch[1]}(${calledWithMatch[2]})).called(1);`;
        }
        return `// TODO: Convert spy call: ${spyCall}`;
    }
    /**
     * Convert Flutter verify to Jest spy
     */
    convertVerifyToSpy(verifyCall) {
        // Convert: verify(mockFn()).called(1)
        // To: expect(mockFn).toHaveBeenCalled()
        const calledMatch = verifyCall.match(/verify\(([^)]+)\(\)\)\.called\((\d+)\)/);
        if (calledMatch) {
            const times = parseInt(calledMatch[2]);
            if (times === 1) {
                return `expect(${calledMatch[1]}).toHaveBeenCalled();`;
            }
            return `expect(${calledMatch[1]}).toHaveBeenCalledTimes(${times});`;
        }
        const withArgsMatch = verifyCall.match(/verify\(([^)]+)\(([^)]+)\)\)\.called\((\d+)\)/);
        if (withArgsMatch) {
            return `expect(${withArgsMatch[1]}).toHaveBeenCalledWith(${withArgsMatch[2]});`;
        }
        return `// TODO: Convert verify call: ${verifyCall}`;
    }
}
exports.MockConverter = MockConverter;
