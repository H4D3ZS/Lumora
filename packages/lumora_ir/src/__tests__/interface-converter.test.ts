/**
 * Tests for Interface-Converter
 */

import { 
  InterfaceConverter, 
  getInterfaceConverter,
  type TypeScriptInterface,
  type DartClass
} from '../types/interface-converter';

describe('InterfaceConverter', () => {
  let converter: InterfaceConverter;

  beforeEach(() => {
    converter = getInterfaceConverter();
  });

  describe('TypeScript to Dart conversion', () => {
    test('should convert simple interface to Dart class', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'age', type: 'number' },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.name).toBe('User');
      expect(dartClass.properties).toHaveLength(3);
      expect(dartClass.properties[0]).toEqual({
        name: 'id',
        type: 'String',
        nullable: false,
        final: undefined,
        documentation: undefined,
      });
      expect(dartClass.properties[1]).toEqual({
        name: 'name',
        type: 'String',
        nullable: false,
        final: undefined,
        documentation: undefined,
      });
      expect(dartClass.properties[2]).toEqual({
        name: 'age',
        type: 'double',
        nullable: false,
        final: undefined,
        documentation: undefined,
      });
    });

    test('should handle optional properties', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string' },
          { name: 'email', type: 'string', optional: true },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.properties[0].nullable).toBe(false);
      expect(dartClass.properties[1].nullable).toBe(true);
    });

    test('should handle readonly properties', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', readonly: true },
          { name: 'name', type: 'string' },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.properties[0].final).toBe(true);
      expect(dartClass.properties[1].final).toBe(undefined);
    });

    test('should convert methods', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'Calculator',
        properties: [],
        methods: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'number' },
              { name: 'b', type: 'number' },
            ],
            returnType: 'number',
          },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.methods).toHaveLength(1);
      expect(dartClass.methods![0].name).toBe('add');
      expect(dartClass.methods![0].returnType).toBe('double');
      expect(dartClass.methods![0].parameters).toHaveLength(2);
      expect(dartClass.methods![0].parameters[0].type).toBe('double');
    });

    test('should preserve documentation', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        documentation: 'Represents a user in the system',
        properties: [
          { 
            name: 'id', 
            type: 'string',
            documentation: 'Unique identifier'
          },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.documentation).toBe('Represents a user in the system');
      expect(dartClass.properties[0].documentation).toBe('Unique identifier');
    });

    test('should handle generic type parameters', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'Container',
        typeParameters: ['T'],
        properties: [
          { name: 'value', type: 'T' },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.typeParameters).toEqual(['T']);
    });

    test('should generate constructor', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
        ],
      };

      const dartClass = converter.typeScriptInterfaceToDartClass(tsInterface);

      expect(dartClass.constructors).toHaveLength(1);
      expect(dartClass.constructors![0].parameters).toHaveLength(2);
      expect(dartClass.constructors![0].parameters[0].named).toBe(true);
      expect(dartClass.constructors![0].parameters[0].required).toBe(true);
    });
  });

  describe('Dart to TypeScript conversion', () => {
    test('should convert simple Dart class to interface', () => {
      const dartClass: DartClass = {
        name: 'User',
        properties: [
          { name: 'id', type: 'String' },
          { name: 'name', type: 'String' },
          { name: 'age', type: 'int' },
        ],
      };

      const tsInterface = converter.dartClassToTypeScriptInterface(dartClass);

      expect(tsInterface.name).toBe('User');
      expect(tsInterface.properties).toHaveLength(3);
      expect(tsInterface.properties[0]).toEqual({
        name: 'id',
        type: 'string',
        optional: undefined,
        readonly: undefined,
        documentation: undefined,
      });
      expect(tsInterface.properties[2].type).toBe('number');
    });

    test('should handle nullable properties', () => {
      const dartClass: DartClass = {
        name: 'User',
        properties: [
          { name: 'id', type: 'String' },
          { name: 'email', type: 'String', nullable: true },
        ],
      };

      const tsInterface = converter.dartClassToTypeScriptInterface(dartClass);

      expect(tsInterface.properties[0].optional).toBe(undefined);
      expect(tsInterface.properties[1].optional).toBe(true);
    });

    test('should handle final properties', () => {
      const dartClass: DartClass = {
        name: 'User',
        properties: [
          { name: 'id', type: 'String', final: true },
          { name: 'name', type: 'String' },
        ],
      };

      const tsInterface = converter.dartClassToTypeScriptInterface(dartClass);

      expect(tsInterface.properties[0].readonly).toBe(true);
      expect(tsInterface.properties[1].readonly).toBe(undefined);
    });

    test('should convert methods', () => {
      const dartClass: DartClass = {
        name: 'Calculator',
        properties: [],
        methods: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'double', required: true },
              { name: 'b', type: 'double', required: true },
            ],
            returnType: 'double',
          },
        ],
      };

      const tsInterface = converter.dartClassToTypeScriptInterface(dartClass);

      expect(tsInterface.methods).toHaveLength(1);
      expect(tsInterface.methods![0].name).toBe('add');
      expect(tsInterface.methods![0].returnType).toBe('number');
      expect(tsInterface.methods![0].parameters).toHaveLength(2);
      expect(tsInterface.methods![0].parameters[0].type).toBe('number');
    });

    test('should preserve documentation', () => {
      const dartClass: DartClass = {
        name: 'User',
        documentation: 'Represents a user in the system',
        properties: [
          { 
            name: 'id', 
            type: 'String',
            documentation: 'Unique identifier'
          },
        ],
      };

      const tsInterface = converter.dartClassToTypeScriptInterface(dartClass);

      expect(tsInterface.documentation).toBe('Represents a user in the system');
      expect(tsInterface.properties[0].documentation).toBe('Unique identifier');
    });
  });

  describe('Code generation', () => {
    test('should generate TypeScript interface code', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'User',
        documentation: 'User interface',
        properties: [
          { name: 'id', type: 'string', readonly: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string', optional: true },
        ],
      };

      const code = converter.generateTypeScriptInterface(tsInterface);

      expect(code).toContain('export interface User');
      expect(code).toContain('readonly id: string;');
      expect(code).toContain('name: string;');
      expect(code).toContain('email?: string;');
      expect(code).toContain('/** User interface */');
    });

    test('should generate TypeScript interface with methods', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'Calculator',
        properties: [],
        methods: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'number' },
              { name: 'b', type: 'number' },
            ],
            returnType: 'number',
          },
        ],
      };

      const code = converter.generateTypeScriptInterface(tsInterface);

      expect(code).toContain('add(a: number, b: number): number;');
    });

    test('should generate TypeScript interface with generics', () => {
      const tsInterface: TypeScriptInterface = {
        name: 'Container',
        typeParameters: ['T'],
        properties: [
          { name: 'value', type: 'T' },
        ],
      };

      const code = converter.generateTypeScriptInterface(tsInterface);

      expect(code).toContain('export interface Container<T>');
      expect(code).toContain('value: T;');
    });

    test('should generate Dart class code', () => {
      const dartClass: DartClass = {
        name: 'User',
        documentation: 'User class',
        properties: [
          { name: 'id', type: 'String', final: true },
          { name: 'name', type: 'String' },
          { name: 'email', type: 'String', nullable: true },
        ],
        constructors: [
          {
            parameters: [
              { name: 'id', type: 'String', required: true, named: true },
              { name: 'name', type: 'String', required: true, named: true },
              { name: 'email', type: 'String', required: false, named: true },
            ],
          },
        ],
      };

      const code = converter.generateDartClass(dartClass);

      expect(code).toContain('class User');
      expect(code).toContain('final String id;');
      expect(code).toContain('String name;');
      expect(code).toContain('String? email;');
      expect(code).toContain('/// User class');
      expect(code).toContain('required this.id');
      expect(code).toContain('required this.name');
      expect(code).toContain('this.email');
    });

    test('should generate Dart class with methods', () => {
      const dartClass: DartClass = {
        name: 'Calculator',
        properties: [],
        methods: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'double', required: true },
              { name: 'b', type: 'double', required: true },
            ],
            returnType: 'double',
          },
        ],
      };

      const code = converter.generateDartClass(dartClass);

      expect(code).toContain('double add(double a, double b)');
      expect(code).toContain('throw UnimplementedError();');
    });
  });

  describe('Singleton pattern', () => {
    test('should return same instance', () => {
      const instance1 = getInterfaceConverter();
      const instance2 = getInterfaceConverter();
      expect(instance1).toBe(instance2);
    });
  });
});
