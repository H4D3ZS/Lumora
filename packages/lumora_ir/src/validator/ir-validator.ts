import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { LumoraIR, ValidationResult, ValidationError } from '../types/ir-types';
import irSchema from '../schema/ir-schema.json';

/**
 * IR Validator
 * Validates Lumora IR against JSON Schema
 */
export class IRValidator {
  private ajv: Ajv;
  private validateFn: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    
    addFormats(this.ajv);
    this.validateFn = this.ajv.compile(irSchema);
  }

  /**
   * Validate IR against schema
   */
  validate(ir: any): ValidationResult {
    const valid = this.validateFn(ir);

    if (valid) {
      return { valid: true };
    }

    const errors: ValidationError[] = (this.validateFn.errors || []).map(err => ({
      path: err.instancePath || err.schemaPath,
      message: err.message || 'Validation error',
      keyword: err.keyword,
    }));

    return {
      valid: false,
      errors,
    };
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(ir: any): asserts ir is LumoraIR {
    const result = this.validate(ir);
    
    if (!result.valid) {
      const errorMessages = result.errors!
        .map(err => `${err.path}: ${err.message}`)
        .join('\n');
      
      throw new Error(`IR validation failed:\n${errorMessages}`);
    }
  }

  /**
   * Check if IR has valid version format
   */
  isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  /**
   * Validate node structure recursively
   */
  validateNode(node: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!node.id || typeof node.id !== 'string') {
      errors.push({ path: 'node.id', message: 'Node must have a string id' });
    }

    if (!node.type || typeof node.type !== 'string') {
      errors.push({ path: 'node.type', message: 'Node must have a string type' });
    }

    if (!node.props || typeof node.props !== 'object') {
      errors.push({ path: 'node.props', message: 'Node must have props object' });
    }

    if (!Array.isArray(node.children)) {
      errors.push({ path: 'node.children', message: 'Node must have children array' });
    }

    if (!node.metadata || typeof node.metadata.lineNumber !== 'number') {
      errors.push({ path: 'node.metadata', message: 'Node must have metadata with lineNumber' });
    }

    // Recursively validate children
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, index: number) => {
        const childResult = this.validateNode(child);
        if (!childResult.valid && childResult.errors) {
          errors.push(...childResult.errors.map(err => ({
            ...err,
            path: `node.children[${index}].${err.path}`,
          })));
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

// Singleton instance
let validatorInstance: IRValidator | null = null;

/**
 * Get singleton validator instance
 */
export function getValidator(): IRValidator {
  if (!validatorInstance) {
    validatorInstance = new IRValidator();
  }
  return validatorInstance;
}
