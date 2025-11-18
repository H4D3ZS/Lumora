/**
 * Bidirectional Converter
 * Orchestrates React ↔ Flutter conversion through Lumora IR
 */
import { type ReactParserConfig } from '../parsers/react-parser';
import { type DartParserConfig } from '../parsers/dart-parser';
import { type ReactGeneratorConfig } from '../generators/react-generator';
import { type FlutterGeneratorConfig } from '../generators/flutter-generator';
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler } from '../errors/error-handler';
export interface BidirectionalConverterConfig {
    errorHandler?: ErrorHandler;
    reactParser?: ReactParserConfig;
    dartParser?: DartParserConfig;
    reactGenerator?: ReactGeneratorConfig;
    flutterGenerator?: FlutterGeneratorConfig;
}
/**
 * Bidirectional Converter
 * Enables seamless conversion between React and Flutter
 */
export declare class BidirectionalConverter {
    private reactParser;
    private dartParser;
    private reactGenerator;
    private flutterGenerator;
    private errorHandler;
    constructor(config?: BidirectionalConverterConfig);
    /**
     * Convert React/TSX to Flutter/Dart
     * React → IR → Flutter
     */
    reactToFlutter(reactCode: string, filename?: string): string;
    /**
     * Convert Flutter/Dart to React/TSX
     * Flutter → IR → React
     */
    flutterToReact(flutterCode: string, filename?: string): string;
    /**
     * Parse React to IR (for inspection or custom generation)
     */
    parseReact(reactCode: string, filename?: string): LumoraIR;
    /**
     * Parse Flutter to IR (for inspection or custom generation)
     */
    parseFlutter(flutterCode: string, filename?: string): LumoraIR;
    /**
     * Generate React from IR
     */
    generateReact(ir: LumoraIR, options?: any): string;
    /**
     * Generate Flutter from IR
     */
    generateFlutter(ir: LumoraIR): string;
    /**
     * Round-trip conversion test: React → Flutter → React
     * Useful for testing conversion fidelity
     */
    testReactRoundTrip(reactCode: string, filename?: string): Promise<{
        original: string;
        flutter: string;
        backToReact: string;
        ir1: LumoraIR;
        ir2: LumoraIR;
    }>;
    /**
     * Round-trip conversion test: Flutter → React → Flutter
     * Useful for testing conversion fidelity
     */
    testFlutterRoundTrip(flutterCode: string, filename?: string): Promise<{
        original: string;
        react: string;
        backToFlutter: string;
        ir1: LumoraIR;
        ir2: LumoraIR;
    }>;
}
/**
 * Helper function to create bidirectional converter
 */
export declare function createBidirectionalConverter(config?: BidirectionalConverterConfig): BidirectionalConverter;
/**
 * Quick conversion helpers
 */
export declare function convertReactToFlutter(reactCode: string, filename?: string, config?: BidirectionalConverterConfig): string;
export declare function convertFlutterToReact(flutterCode: string, filename?: string, config?: BidirectionalConverterConfig): string;
