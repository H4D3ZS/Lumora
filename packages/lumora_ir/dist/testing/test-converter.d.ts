/**
 * Test Converter
 * Converts test files between React (Jest) and Flutter (widget tests)
 */
export interface TestCase {
    name: string;
    type: 'unit' | 'widget' | 'integration';
    setup?: string[];
    assertions: TestAssertion[];
    mocks?: MockDefinition[];
    async?: boolean;
}
export interface TestAssertion {
    type: 'equals' | 'contains' | 'throws' | 'called' | 'rendered' | 'custom';
    actual: string;
    expected?: any;
    matcher: string;
    negated?: boolean;
}
export interface MockDefinition {
    name: string;
    type: string;
    methods?: MockMethod[];
    returnValue?: any;
}
export interface MockMethod {
    name: string;
    returnValue?: any;
    implementation?: string;
}
export interface TestFile {
    framework: 'react' | 'flutter';
    imports: string[];
    testSuite: TestSuite;
    mocks: MockDefinition[];
}
export interface TestSuite {
    name: string;
    setup?: string[];
    teardown?: string[];
    testCases: TestCase[];
}
export declare class TestConverter {
    /**
     * Convert React Jest test to Flutter widget test
     */
    convertReactToFlutter(testFile: TestFile): string;
    /**
     * Convert Flutter widget test to React Jest test
     */
    convertFlutterToReact(testFile: TestFile): string;
    /**
     * Generate Flutter imports
     */
    private generateFlutterImports;
    /**
     * Generate React imports
     */
    private generateReactImports;
    /**
     * Generate Flutter test suite
     */
    private generateFlutterTestSuite;
    /**
     * Generate React test suite
     */
    private generateReactTestSuite;
    /**
     * Generate Flutter test case
     */
    private generateFlutterTestCase;
    /**
     * Generate React test case
     */
    private generateReactTestCase;
    /**
     * Convert assertion to Flutter matcher
     */
    private convertAssertionToFlutter;
    /**
     * Convert assertion to Jest matcher
     */
    private convertAssertionToJest;
    /**
     * Parse React Jest test file
     */
    parseReactTest(content: string): TestFile;
    /**
     * Parse Flutter widget test file
     */
    parseFlutterTest(content: string): TestFile;
    /**
     * Generate test stub for unconvertible tests
     */
    generateTestStub(testName: string, framework: 'react' | 'flutter', reason: string): string;
}
