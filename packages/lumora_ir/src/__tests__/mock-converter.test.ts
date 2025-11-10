import { MockConverter, MockDefinition, MockMethod } from '../testing/mock-converter';

describe('MockConverter', () => {
  let converter: MockConverter;

  beforeEach(() => {
    converter = new MockConverter();
  });

  describe('convertReactMockToFlutter', () => {
    it('should convert basic React mock to Flutter', () => {
      const mock: MockDefinition = {
        name: 'UserService',
        type: 'UserService',
        methods: [
          {
            name: 'getUser',
            returnValue: { id: 1, name: 'John' },
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);

      expect(result).toContain('class MockUserService extends Mock implements UserService');
      expect(result).toContain('@override');
      expect(result).toContain('getUser');
    });

    it('should handle methods with parameters', () => {
      const mock: MockDefinition = {
        name: 'DataService',
        type: 'DataService',
        methods: [
          {
            name: 'fetchData',
            parameters: [
              { name: 'id', type: 'int' },
              { name: 'options', type: 'Map<String, dynamic>', optional: true },
            ],
            returnValue: 'data',
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);

      expect(result).toContain('fetchData(int id, Map<String, dynamic> options)');
    });

    it('should handle methods with custom implementation', () => {
      const mock: MockDefinition = {
        name: 'Calculator',
        type: 'Calculator',
        methods: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'int' },
              { name: 'b', type: 'int' },
            ],
            implementation: 'a + b',
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);

      expect(result).toContain('add(int a, int b) => a + b');
    });
  });

  describe('convertFlutterMockToReact', () => {
    it('should convert basic Flutter mock to React', () => {
      const mock: MockDefinition = {
        name: 'UserService',
        type: 'UserService',
        methods: [
          {
            name: 'getUser',
            returnValue: { id: 1, name: 'John' },
          },
        ],
      };

      const result = converter.convertFlutterMockToReact(mock);

      expect(result).toContain('const mockUserService = {');
      expect(result).toContain('getUser: jest.fn().mockReturnValue(');
      expect(result).toContain('"id":1');
      expect(result).toContain('"name":"John"');
    });

    it('should handle methods without return values', () => {
      const mock: MockDefinition = {
        name: 'Logger',
        type: 'Logger',
        methods: [
          {
            name: 'log',
          },
          {
            name: 'error',
          },
        ],
      };

      const result = converter.convertFlutterMockToReact(mock);

      expect(result).toContain('log: jest.fn()');
      expect(result).toContain('error: jest.fn()');
    });

    it('should handle methods with custom implementation', () => {
      const mock: MockDefinition = {
        name: 'Counter',
        type: 'Counter',
        methods: [
          {
            name: 'increment',
            implementation: '() => count++',
          },
        ],
      };

      const result = converter.convertFlutterMockToReact(mock);

      expect(result).toContain('increment: jest.fn(() => count++)');
    });
  });

  describe('parseReactMock', () => {
    it('should parse jest.fn() mocks', () => {
      const content = `
        const mockFn = jest.fn();
        const anotherMock = jest.fn();
      `;

      const result = converter.parseReactMock(content);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('mockFn');
      expect(result[1].name).toBe('anotherMock');
    });

    it('should parse jest.mock() patterns', () => {
      const content = `
        jest.mock('./UserService', () => ({
          getUser: jest.fn(),
        }));
      `;

      const result = converter.parseReactMock(content);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('parseFlutterMock', () => {
    it('should parse Mock class definitions', () => {
      const content = `
        class MockUserService extends Mock implements UserService {}
        class MockDataService extends Mock implements DataService {}
      `;

      const result = converter.parseFlutterMock(content);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('UserService');
      expect(result[0].type).toBe('UserService');
      expect(result[1].name).toBe('DataService');
      expect(result[1].type).toBe('DataService');
    });
  });

  describe('generateReactMockSetup', () => {
    it('should generate mock setup code', () => {
      const mocks: MockDefinition[] = [
        {
          name: 'userService',
          type: 'UserService',
          methods: [
            {
              name: 'getUser',
              returnValue: { id: 1 },
            },
            {
              name: 'updateUser',
              returnValue: true,
            },
          ],
        },
      ];

      const result = converter.generateReactMockSetup(mocks);

      expect(result).toContain('// Setup userService mock');
      expect(result).toContain('userService.getUser.mockReturnValue(');
      expect(result).toContain('userService.updateUser.mockReturnValue(true)');
    });

    it('should handle empty mocks', () => {
      const result = converter.generateReactMockSetup([]);
      expect(result).toBe('');
    });
  });

  describe('generateFlutterMockSetup', () => {
    it('should generate mock setup code', () => {
      const mocks: MockDefinition[] = [
        {
          name: 'UserService',
          type: 'UserService',
          methods: [
            {
              name: 'getUser',
              returnValue: { id: 1 },
            },
          ],
        },
      ];

      const result = converter.generateFlutterMockSetup(mocks);

      expect(result).toContain('// Setup UserService mock');
      expect(result).toContain('final mockUserService = MockUserService();');
      expect(result).toContain('when(mockUserService.getUser()).thenReturn(');
    });
  });

  describe('convertSpyToVerify', () => {
    it('should convert toHaveBeenCalled', () => {
      const result = converter.convertSpyToVerify('expect(mockFn).toHaveBeenCalled()');
      expect(result).toBe('verify(mockFn()).called(1);');
    });

    it('should convert toHaveBeenCalledTimes', () => {
      const result = converter.convertSpyToVerify('expect(mockFn).toHaveBeenCalledTimes(3)');
      expect(result).toBe('verify(mockFn()).called(3);');
    });

    it('should convert toHaveBeenCalledWith', () => {
      const result = converter.convertSpyToVerify('expect(mockFn).toHaveBeenCalledWith(arg1, arg2)');
      expect(result).toBe('verify(mockFn(arg1, arg2)).called(1);');
    });

    it('should handle unknown patterns', () => {
      const result = converter.convertSpyToVerify('expect(mockFn).toHaveBeenCustom()');
      expect(result).toContain('// TODO: Convert spy call');
    });
  });

  describe('convertVerifyToSpy', () => {
    it('should convert verify called once', () => {
      const result = converter.convertVerifyToSpy('verify(mockFn()).called(1)');
      expect(result).toBe('expect(mockFn).toHaveBeenCalled();');
    });

    it('should convert verify called multiple times', () => {
      const result = converter.convertVerifyToSpy('verify(mockFn()).called(3)');
      expect(result).toBe('expect(mockFn).toHaveBeenCalledTimes(3);');
    });

    it('should convert verify with arguments', () => {
      const result = converter.convertVerifyToSpy('verify(mockFn(arg1, arg2)).called(1)');
      expect(result).toBe('expect(mockFn).toHaveBeenCalledWith(arg1, arg2);');
    });

    it('should handle unknown patterns', () => {
      const result = converter.convertVerifyToSpy('verify(mockFn()).custom()');
      expect(result).toContain('// TODO: Convert verify call');
    });
  });

  describe('type inference', () => {
    it('should infer String type', () => {
      const mock: MockDefinition = {
        name: 'Service',
        type: 'Service',
        methods: [
          {
            name: 'getString',
            returnValue: 'hello',
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);
      expect(result).toContain('String getString');
    });

    it('should infer int type', () => {
      const mock: MockDefinition = {
        name: 'Service',
        type: 'Service',
        methods: [
          {
            name: 'getInt',
            returnValue: 42,
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);
      expect(result).toContain('int getInt');
    });

    it('should infer bool type', () => {
      const mock: MockDefinition = {
        name: 'Service',
        type: 'Service',
        methods: [
          {
            name: 'getBool',
            returnValue: true,
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);
      expect(result).toContain('bool getBool');
    });

    it('should infer List type', () => {
      const mock: MockDefinition = {
        name: 'Service',
        type: 'Service',
        methods: [
          {
            name: 'getList',
            returnValue: [1, 2, 3],
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);
      expect(result).toContain('List<dynamic> getList');
    });

    it('should use void for undefined', () => {
      const mock: MockDefinition = {
        name: 'Service',
        type: 'Service',
        methods: [
          {
            name: 'doSomething',
          },
        ],
      };

      const result = converter.convertReactMockToFlutter(mock);
      expect(result).toContain('void doSomething');
    });
  });
});
