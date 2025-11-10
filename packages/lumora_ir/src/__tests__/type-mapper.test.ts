/**
 * Tests for Type-Mapper
 */

import { TypeMapper, getTypeMapper } from '../types/type-mapper';

describe('TypeMapper', () => {
  let typeMapper: TypeMapper;

  beforeEach(() => {
    typeMapper = getTypeMapper();
  });

  describe('TypeScript to Dart conversion', () => {
    test('should convert primitive types', () => {
      expect(typeMapper.typeScriptToDart('string')).toBe('String');
      expect(typeMapper.typeScriptToDart('number')).toBe('double');
      expect(typeMapper.typeScriptToDart('boolean')).toBe('bool');
      expect(typeMapper.typeScriptToDart('void')).toBe('void');
      expect(typeMapper.typeScriptToDart('any')).toBe('dynamic');
      expect(typeMapper.typeScriptToDart('null')).toBe('null');
    });

    test('should convert nullable types', () => {
      expect(typeMapper.typeScriptToDart('string?')).toBe('String?');
      expect(typeMapper.typeScriptToDart('number?')).toBe('double?');
      expect(typeMapper.typeScriptToDart('boolean?')).toBe('bool?');
    });

    test('should convert union types with null', () => {
      expect(typeMapper.typeScriptToDart('string | null')).toBe('String?');
      expect(typeMapper.typeScriptToDart('number | undefined')).toBe('double?');
      expect(typeMapper.typeScriptToDart('boolean | null | undefined')).toBe('bool?');
    });

    test('should convert array types', () => {
      expect(typeMapper.typeScriptToDart('string[]')).toBe('List<String>');
      expect(typeMapper.typeScriptToDart('number[]')).toBe('List<double>');
      expect(typeMapper.typeScriptToDart('boolean[]')).toBe('List<bool>');
    });

    test('should convert generic types', () => {
      expect(typeMapper.typeScriptToDart('Array<string>')).toBe('List<String>');
      expect(typeMapper.typeScriptToDart('Promise<number>')).toBe('Future<double>');
      expect(typeMapper.typeScriptToDart('Record<string, any>')).toBe('Map<String, dynamic>');
    });

    test('should preserve generic type parameters', () => {
      expect(typeMapper.typeScriptToDart('Array<User>')).toBe('List<User>');
      expect(typeMapper.typeScriptToDart('Promise<Response>')).toBe('Future<Response>');
    });

    test('should handle nested generics', () => {
      expect(typeMapper.typeScriptToDart('Array<Array<string>>')).toBe('List<List<String>>');
      expect(typeMapper.typeScriptToDart('Promise<Array<number>>')).toBe('Future<List<double>>');
      expect(typeMapper.typeScriptToDart('Record<string, Array<boolean>>')).toBe('Map<String, List<bool>>');
    });

    test('should convert custom types as-is', () => {
      expect(typeMapper.typeScriptToDart('User')).toBe('User');
      expect(typeMapper.typeScriptToDart('CustomType')).toBe('CustomType');
    });
  });

  describe('Dart to TypeScript conversion', () => {
    test('should convert primitive types', () => {
      expect(typeMapper.dartToTypeScript('String')).toBe('string');
      expect(typeMapper.dartToTypeScript('double')).toBe('number');
      expect(typeMapper.dartToTypeScript('int')).toBe('number');
      expect(typeMapper.dartToTypeScript('bool')).toBe('boolean');
      expect(typeMapper.dartToTypeScript('void')).toBe('void');
      expect(typeMapper.dartToTypeScript('dynamic')).toBe('any');
      expect(typeMapper.dartToTypeScript('null')).toBe('null');
    });

    test('should convert nullable types', () => {
      expect(typeMapper.dartToTypeScript('String?')).toBe('string | null');
      expect(typeMapper.dartToTypeScript('double?')).toBe('number | null');
      expect(typeMapper.dartToTypeScript('bool?')).toBe('boolean | null');
    });

    test('should convert List types', () => {
      expect(typeMapper.dartToTypeScript('List<String>')).toBe('string[]');
      expect(typeMapper.dartToTypeScript('List<double>')).toBe('number[]');
      expect(typeMapper.dartToTypeScript('List<bool>')).toBe('boolean[]');
    });

    test('should convert Map types', () => {
      expect(typeMapper.dartToTypeScript('Map<String, dynamic>')).toBe('Record<string, any>');
      expect(typeMapper.dartToTypeScript('Map<String, int>')).toBe('Record<string, number>');
    });

    test('should convert Future types', () => {
      expect(typeMapper.dartToTypeScript('Future<String>')).toBe('Promise<string>');
      expect(typeMapper.dartToTypeScript('Future<int>')).toBe('Promise<number>');
    });

    test('should preserve generic type parameters', () => {
      expect(typeMapper.dartToTypeScript('List<User>')).toBe('User[]');
      expect(typeMapper.dartToTypeScript('Future<Response>')).toBe('Promise<Response>');
    });

    test('should handle nested generics', () => {
      expect(typeMapper.dartToTypeScript('List<List<String>>')).toBe('string[][]');
      expect(typeMapper.dartToTypeScript('Future<List<int>>')).toBe('Promise<number[]>');
    });

    test('should convert custom types as-is', () => {
      expect(typeMapper.dartToTypeScript('User')).toBe('User');
      expect(typeMapper.dartToTypeScript('CustomType')).toBe('CustomType');
    });
  });

  describe('Nullable type handling', () => {
    test('should detect nullable types', () => {
      expect(typeMapper.isNullable('string?')).toBe(true);
      expect(typeMapper.isNullable('String?')).toBe(true);
      expect(typeMapper.isNullable('number | null')).toBe(true);
      expect(typeMapper.isNullable('string | undefined')).toBe(true);
      expect(typeMapper.isNullable('string')).toBe(false);
      expect(typeMapper.isNullable('String')).toBe(false);
    });

    test('should make types nullable', () => {
      expect(typeMapper.makeNullable('string', 'typescript')).toBe('string | null');
      expect(typeMapper.makeNullable('String', 'dart')).toBe('String?');
      expect(typeMapper.makeNullable('string?', 'typescript')).toBe('string?');
      expect(typeMapper.makeNullable('String?', 'dart')).toBe('String?');
    });

    test('should make types non-nullable', () => {
      expect(typeMapper.makeNonNullable('string?')).toBe('string');
      expect(typeMapper.makeNonNullable('String?')).toBe('String');
      expect(typeMapper.makeNonNullable('number | null')).toBe('number');
      expect(typeMapper.makeNonNullable('string | undefined')).toBe('string');
      expect(typeMapper.makeNonNullable('string')).toBe('string');
    });
  });

  describe('Type inference', () => {
    test('should infer TypeScript types from values', () => {
      expect(typeMapper.inferType('hello', 'typescript')).toBe('string');
      expect(typeMapper.inferType(42, 'typescript')).toBe('number');
      expect(typeMapper.inferType(true, 'typescript')).toBe('boolean');
      expect(typeMapper.inferType(null, 'typescript')).toBe('any');
      expect(typeMapper.inferType(undefined, 'typescript')).toBe('any');
      expect(typeMapper.inferType(['a', 'b'], 'typescript')).toBe('string[]');
      expect(typeMapper.inferType([1, 2], 'typescript')).toBe('number[]');
      expect(typeMapper.inferType([], 'typescript')).toBe('any[]');
      expect(typeMapper.inferType({}, 'typescript')).toBe('Record<string, any>');
    });

    test('should infer Dart types from values', () => {
      expect(typeMapper.inferType('hello', 'dart')).toBe('String');
      expect(typeMapper.inferType(42, 'dart')).toBe('double');
      expect(typeMapper.inferType(true, 'dart')).toBe('bool');
      expect(typeMapper.inferType(null, 'dart')).toBe('dynamic');
      expect(typeMapper.inferType(undefined, 'dart')).toBe('dynamic');
      expect(typeMapper.inferType(['a', 'b'], 'dart')).toBe('List<String>');
      expect(typeMapper.inferType([1, 2], 'dart')).toBe('List<double>');
      expect(typeMapper.inferType([], 'dart')).toBe('List<dynamic>');
      expect(typeMapper.inferType({}, 'dart')).toBe('Map<String, dynamic>');
    });
  });

  describe('Singleton pattern', () => {
    test('should return same instance', () => {
      const instance1 = getTypeMapper();
      const instance2 = getTypeMapper();
      expect(instance1).toBe(instance2);
    });
  });
});
