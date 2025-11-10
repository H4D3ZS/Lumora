/**
 * Mock Converter
 * Converts mock definitions between React and Flutter test frameworks
 */
export interface MockDefinition {
    name: string;
    type: string;
    methods?: MockMethod[];
    properties?: MockProperty[];
    returnValue?: any;
}
export interface MockMethod {
    name: string;
    parameters?: MockParameter[];
    returnValue?: any;
    implementation?: string;
}
export interface MockProperty {
    name: string;
    type: string;
    value?: any;
}
export interface MockParameter {
    name: string;
    type: string;
    optional?: boolean;
}
export declare class MockConverter {
    /**
     * Convert React mock to Flutter mock
     */
    convertReactMockToFlutter(mock: MockDefinition): string;
    /**
     * Convert Flutter mock to React mock
     */
    convertFlutterMockToReact(mock: MockDefinition): string;
    /**
     * Generate Flutter mock method
     */
    private generateFlutterMockMethod;
    /**
     * Generate Jest mock method
     */
    private generateJestMockMethod;
    /**
     * Infer Flutter return type from value
     */
    private inferFlutterReturnType;
    /**
     * Parse React Jest mock
     */
    parseReactMock(content: string): MockDefinition[];
    /**
     * Parse Flutter mock
     */
    parseFlutterMock(content: string): MockDefinition[];
    /**
     * Generate mock setup code for React
     */
    generateReactMockSetup(mocks: MockDefinition[]): string;
    /**
     * Generate mock setup code for Flutter
     */
    generateFlutterMockSetup(mocks: MockDefinition[]): string;
    /**
     * Convert Jest spy to Flutter verify
     */
    convertSpyToVerify(spyCall: string): string;
    /**
     * Convert Flutter verify to Jest spy
     */
    convertVerifyToSpy(verifyCall: string): string;
}
