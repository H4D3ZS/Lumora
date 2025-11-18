/**
 * Bidirectional Converter
 * Orchestrates React ↔ Flutter conversion through Lumora IR
 */

import { ReactParser, type ReactParserConfig } from '../parsers/react-parser';
import { DartParser, type DartParserConfig } from '../parsers/dart-parser';
import { ReactGenerator, type ReactGeneratorConfig } from '../generators/react-generator';
import { FlutterGenerator, type FlutterGeneratorConfig } from '../generators/flutter-generator';
import { LumoraIR } from '../types/ir-types';
import { ErrorHandler, getErrorHandler } from '../errors/error-handler';

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
export class BidirectionalConverter {
  private reactParser: ReactParser;
  private dartParser: DartParser;
  private reactGenerator: ReactGenerator;
  private flutterGenerator: FlutterGenerator;
  private errorHandler: ErrorHandler;

  constructor(config: BidirectionalConverterConfig = {}) {
    this.errorHandler = config.errorHandler || getErrorHandler();
    
    this.reactParser = new ReactParser({
      ...config.reactParser,
      errorHandler: this.errorHandler,
    });
    
    this.dartParser = new DartParser({
      ...config.dartParser,
      errorHandler: this.errorHandler,
    });
    
    this.reactGenerator = new ReactGenerator({
      ...config.reactGenerator,
      errorHandler: this.errorHandler,
    });
    
    this.flutterGenerator = new FlutterGenerator({
      ...config.flutterGenerator,
      errorHandler: this.errorHandler,
    });
  }

  /**
   * Convert React/TSX to Flutter/Dart
   * React → IR → Flutter
   */
  reactToFlutter(reactCode: string, filename: string = 'component.tsx'): string {
    try {
      // Parse React to IR
      const ir = this.reactParser.parse(reactCode, filename);
      
      // Generate Flutter from IR
      const flutterCode = this.flutterGenerator.generate(ir);
      
      return flutterCode;
    } catch (error) {
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
  flutterToReact(flutterCode: string, filename: string = 'widget.dart'): string {
    try {
      // Parse Flutter to IR
      const ir = this.dartParser.parse(flutterCode, filename);
      
      // Generate React from IR
      const reactCode = this.reactGenerator.generate(ir);
      
      return reactCode;
    } catch (error) {
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
  parseReact(reactCode: string, filename: string = 'component.tsx'): LumoraIR {
    return this.reactParser.parse(reactCode, filename);
  }

  /**
   * Parse Flutter to IR (for inspection or custom generation)
   */
  parseFlutter(flutterCode: string, filename: string = 'widget.dart'): LumoraIR {
    return this.dartParser.parse(flutterCode, filename);
  }

  /**
   * Generate React from IR
   */
  generateReact(ir: LumoraIR, options?: any): string {
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
  generateFlutter(ir: LumoraIR): string {
    return this.flutterGenerator.generate(ir);
  }

  /**
   * Round-trip conversion test: React → Flutter → React
   * Useful for testing conversion fidelity
   */
  async testReactRoundTrip(reactCode: string, filename: string = 'component.tsx'): Promise<{
    original: string;
    flutter: string;
    backToReact: string;
    ir1: LumoraIR;
    ir2: LumoraIR;
  }> {
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
  async testFlutterRoundTrip(flutterCode: string, filename: string = 'widget.dart'): Promise<{
    original: string;
    react: string;
    backToFlutter: string;
    ir1: LumoraIR;
    ir2: LumoraIR;
  }> {
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

/**
 * Helper function to create bidirectional converter
 */
export function createBidirectionalConverter(
  config?: BidirectionalConverterConfig
): BidirectionalConverter {
  return new BidirectionalConverter(config);
}

/**
 * Quick conversion helpers
 */

export function convertReactToFlutter(
  reactCode: string,
  filename?: string,
  config?: BidirectionalConverterConfig
): string {
  const converter = new BidirectionalConverter(config);
  return converter.reactToFlutter(reactCode, filename);
}

export function convertFlutterToReact(
  flutterCode: string,
  filename?: string,
  config?: BidirectionalConverterConfig
): string {
  const converter = new BidirectionalConverter(config);
  return converter.flutterToReact(flutterCode, filename);
}
