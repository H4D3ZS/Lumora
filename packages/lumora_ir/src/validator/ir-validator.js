"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRValidator = void 0;
exports.getValidator = getValidator;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const ir_schema_json_1 = __importDefault(require("../schema/ir-schema.json"));
/**
 * IR Validator
 * Validates Lumora IR against JSON Schema
 */
class IRValidator {
    constructor() {
        this.ajv = new ajv_1.default({
            allErrors: true,
            verbose: true,
            strict: false,
        });
        (0, ajv_formats_1.default)(this.ajv);
        this.validateFn = this.ajv.compile(ir_schema_json_1.default);
    }
    /**
     * Validate IR against schema
     */
    validate(ir) {
        const valid = this.validateFn(ir);
        if (valid) {
            return { valid: true };
        }
        const errors = (this.validateFn.errors || []).map(err => ({
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
    validateOrThrow(ir) {
        const result = this.validate(ir);
        if (!result.valid) {
            const errorMessages = result.errors
                .map(err => `${err.path}: ${err.message}`)
                .join('\n');
            throw new Error(`IR validation failed:\n${errorMessages}`);
        }
    }
    /**
     * Check if IR has valid version format
     */
    isValidVersion(version) {
        return /^\d+\.\d+\.\d+$/.test(version);
    }
    /**
     * Validate node structure recursively
     */
    validateNode(node) {
        const errors = [];
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
            node.children.forEach((child, index) => {
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
exports.IRValidator = IRValidator;
// Singleton instance
let validatorInstance = null;
/**
 * Get singleton validator instance
 */
function getValidator() {
    if (!validatorInstance) {
        validatorInstance = new IRValidator();
    }
    return validatorInstance;
}
//# sourceMappingURL=ir-validator.js.map