"use strict";
/**
 * Bidirectional Converter
 * Orchestrates React ↔ Flutter conversion through Lumora IR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidirectionalConverter = void 0;
exports.createBidirectionalConverter = createBidirectionalConverter;
exports.convertReactToFlutter = convertReactToFlutter;
exports.convertFlutterToReact = convertFlutterToReact;
const react_parser_1 = require("../parsers/react-parser");
const dart_parser_1 = require("../parsers/dart-parser");
const react_generator_1 = require("../generators/react-generator");
const flutter_generator_1 = require("../generators/flutter-generator");
const error_handler_1 = require("../errors/error-handler");
/**
 * Bidirectional Converter
 * Enables seamless conversion between React and Flutter
 */
class BidirectionalConverter {
    constructor(config = {}) {
        this.errorHandler = config.errorHandler || (0, error_handler_1.getErrorHandler)();
        this.reactParser = new react_parser_1.ReactParser({
            ...config.reactParser,
            errorHandler: this.errorHandler,
        });
        this.dartParser = new dart_parser_1.DartParser({
            ...config.dartParser,
            errorHandler: this.errorHandler,
        });
        this.reactGenerator = new react_generator_1.ReactGenerator({
            ...config.reactGenerator,
            errorHandler: this.errorHandler,
        });
        this.flutterGenerator = new flutter_generator_1.FlutterGenerator({
            ...config.flutterGenerator,
            errorHandler: this.errorHandler,
        });
    }
    /**
     * Convert React/TSX to Flutter/Dart
     * React → IR → Flutter
     */
    reactToFlutter(reactCode, filename = 'component.tsx') {
        try {
            // Parse React to IR
            const ir = this.reactParser.parse(reactCode, filename);
            // Generate Flutter from IR
            const flutterCode = this.flutterGenerator.generate(ir);
            return flutterCode;
        }
        catch (error) {
            this.errorHandler.handleParseError({
                filePath: filename,
                errorMessage: `Failed to convert React to Flutter: ${error instanceof Error ? error.message : String(error)}`,
                sourceCode: reactCode,
                framework: 'react',
            });
            throw error;
        }
    }
    /**
     * Convert Flutter/Dart to React/TSX
     * Flutter → IR → React
     */
    flutterToReact(flutterCode, filename = 'widget.dart') {
        try {
            // Parse Flutter to IR
            const ir = this.dartParser.parse(flutterCode, filename);
            // Generate React from IR
            const reactCode = this.reactGenerator.generate(ir);
            return reactCode;
        }
        catch (error) {
            this.errorHandler.handleParseError({
                filePath: filename,
                errorMessage: `Failed to convert Flutter to React: ${error instanceof Error ? error.message : String(error)}`,
                sourceCode: flutterCode,
                framework: 'flutter',
            });
            throw error;
        }
    }
    /**
     * Parse React to IR (for inspection or custom generation)
     */
    parseReact(reactCode, filename = 'component.tsx') {
        return this.reactParser.parse(reactCode, filename);
    }
    /**
     * Parse Flutter to IR (for inspection or custom generation)
     */
    parseFlutter(flutterCode, filename = 'widget.dart') {
        return this.dartParser.parse(flutterCode, filename);
    }
    /**
     * Generate React from IR
     */
    generateReact(ir, options) {
        if (options) {
            // Create a new generator with custom options
            const { ReactGenerator } = require('../generators/react-generator');
            const customGenerator = new ReactGenerator(options);
            return customGenerator.generate(ir);
        }
        return this.reactGenerator.generate(ir);
    }
    /**
     * Generate Flutter from IR
     */
    generateFlutter(ir) {
        return this.flutterGenerator.generate(ir);
    }
    /**
     * Round-trip conversion test: React → Flutter → React
     * Useful for testing conversion fidelity
     */
    async testReactRoundTrip(reactCode, filename = 'component.tsx') {
        // React → IR
        const ir1 = this.parseReact(reactCode, filename);
        // IR → Flutter
        const flutter = this.generateFlutter(ir1);
        // Flutter → IR
        const ir2 = this.parseFlutter(flutter, filename.replace('.tsx', '.dart'));
        // IR → React
        const backToReact = this.generateReact(ir2);
        return {
            original: reactCode,
            flutter,
            backToReact,
            ir1,
            ir2,
        };
    }
    /**
     * Round-trip conversion test: Flutter → React → Flutter
     * Useful for testing conversion fidelity
     */
    async testFlutterRoundTrip(flutterCode, filename = 'widget.dart') {
        // Flutter → IR
        const ir1 = this.parseFlutter(flutterCode, filename);
        // IR → React
        const react = this.generateReact(ir1);
        // React → IR
        const ir2 = this.parseReact(react, filename.replace('.dart', '.tsx'));
        // IR → Flutter
        const backToFlutter = this.generateFlutter(ir2);
        return {
            original: flutterCode,
            react,
            backToFlutter,
            ir1,
            ir2,
        };
    }
}
exports.BidirectionalConverter = BidirectionalConverter;
/**
 * Helper function to create bidirectional converter
 */
function createBidirectionalConverter(config) {
    return new BidirectionalConverter(config);
}
/**
 * Quick conversion helpers
 */
function convertReactToFlutter(reactCode, filename, config) {
    const converter = new BidirectionalConverter(config);
    return converter.reactToFlutter(reactCode, filename);
}
function convertFlutterToReact(flutterCode, filename, config) {
    const converter = new BidirectionalConverter(config);
    return converter.flutterToReact(flutterCode, filename);
}
