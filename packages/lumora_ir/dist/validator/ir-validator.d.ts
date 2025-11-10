import { LumoraIR, ValidationResult } from '../types/ir-types';
/**
 * IR Validator
 * Validates Lumora IR against JSON Schema
 */
export declare class IRValidator {
    private ajv;
    private validateFn;
    constructor();
    /**
     * Validate IR against schema
     */
    validate(ir: any): ValidationResult;
    /**
     * Validate and throw on error
     */
    validateOrThrow(ir: any): asserts ir is LumoraIR;
    /**
     * Check if IR has valid version format
     */
    isValidVersion(version: string): boolean;
    /**
     * Validate node structure recursively
     */
    validateNode(node: any): ValidationResult;
}
/**
 * Get singleton validator instance
 */
export declare function getValidator(): IRValidator;
