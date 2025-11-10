import { IRValidator } from '../validator/ir-validator';
import { LumoraIR } from '../types/ir-types';

describe('IRValidator', () => {
  let validator: IRValidator;

  beforeEach(() => {
    validator = new IRValidator();
  });

  describe('validate', () => {
    it('should validate a valid IR', () => {
      const validIR: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: Date.now(),
        },
        nodes: [
          {
            id: 'node1',
            type: 'Container',
            props: {},
            children: [],
            metadata: {
              lineNumber: 1,
            },
          },
        ],
      };

      const result = validator.validate(validIR);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject IR without version', () => {
      const invalidIR: any = {
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const result = validator.validate(invalidIR);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject IR with invalid version format', () => {
      const invalidIR: any = {
        version: 'invalid',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const result = validator.validate(invalidIR);
      expect(result.valid).toBe(false);
    });

    it('should reject IR without metadata', () => {
      const invalidIR: any = {
        version: '1.0.0',
        nodes: [],
      };

      const result = validator.validate(invalidIR);
      expect(result.valid).toBe(false);
    });

    it('should reject IR with invalid sourceFramework', () => {
      const invalidIR: any = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'invalid',
          sourceFile: 'App.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      const result = validator.validate(invalidIR);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateOrThrow', () => {
    it('should not throw for valid IR', () => {
      const validIR: LumoraIR = {
        version: '1.0.0',
        metadata: {
          sourceFramework: 'react',
          sourceFile: 'App.tsx',
          generatedAt: Date.now(),
        },
        nodes: [],
      };

      expect(() => validator.validateOrThrow(validIR)).not.toThrow();
    });

    it('should throw for invalid IR', () => {
      const invalidIR: any = {
        version: '1.0.0',
        nodes: [],
      };

      expect(() => validator.validateOrThrow(invalidIR)).toThrow();
    });
  });

  describe('isValidVersion', () => {
    it('should accept valid semantic versions', () => {
      expect(validator.isValidVersion('1.0.0')).toBe(true);
      expect(validator.isValidVersion('0.1.0')).toBe(true);
      expect(validator.isValidVersion('10.20.30')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(validator.isValidVersion('1.0')).toBe(false);
      expect(validator.isValidVersion('v1.0.0')).toBe(false);
      expect(validator.isValidVersion('invalid')).toBe(false);
    });
  });

  describe('validateNode', () => {
    it('should validate a valid node', () => {
      const validNode = {
        id: 'node1',
        type: 'Container',
        props: {},
        children: [],
        metadata: {
          lineNumber: 1,
        },
      };

      const result = validator.validateNode(validNode);
      expect(result.valid).toBe(true);
    });

    it('should reject node without id', () => {
      const invalidNode = {
        type: 'Container',
        props: {},
        children: [],
        metadata: {
          lineNumber: 1,
        },
      };

      const result = validator.validateNode(invalidNode);
      expect(result.valid).toBe(false);
    });

    it('should validate nested nodes', () => {
      const nodeWithChildren = {
        id: 'parent',
        type: 'Container',
        props: {},
        children: [
          {
            id: 'child',
            type: 'Text',
            props: {},
            children: [],
            metadata: {
              lineNumber: 2,
            },
          },
        ],
        metadata: {
          lineNumber: 1,
        },
      };

      const result = validator.validateNode(nodeWithChildren);
      expect(result.valid).toBe(true);
    });
  });
});
