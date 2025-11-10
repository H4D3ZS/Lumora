import {
  parseJSDoc,
  parseDartdoc,
  jsdocToDartdoc,
  dartdocToJSDoc,
  extractInlineComments
} from '../docs/doc-converter';

describe('Documentation Converter', () => {
  describe('parseJSDoc', () => {
    it('should parse basic JSDoc comment', () => {
      const jsdoc = `/**
       * This is a description
       * @param name - The name parameter
       * @returns The result
       */`;

      const result = parseJSDoc(jsdoc);

      expect(result.description).toBe('This is a description');
      expect(result.params).toHaveLength(1);
      expect(result.params[0].name).toBe('name');
      expect(result.params[0].description).toBe('The name parameter');
      expect(result.returns?.description).toBe('The result');
    });

    it('should parse JSDoc with types', () => {
      const jsdoc = `/**
       * Process data
       * @param {string} name - The name
       * @param {number} age - The age
       * @returns {boolean} Success status
       */`;

      const result = parseJSDoc(jsdoc);

      expect(result.params[0].type).toBe('string');
      expect(result.params[1].type).toBe('number');
      expect(result.returns?.type).toBe('boolean');
    });

    it('should parse JSDoc with examples', () => {
      const jsdoc = `/**
       * Calculate sum
       * @example
       * const result = sum(1, 2);
       * console.log(result); // 3
       */`;

      const result = parseJSDoc(jsdoc);

      expect(result.examples).toHaveLength(1);
      expect(result.examples[0]).toContain('sum(1, 2)');
    });
  });

  describe('parseDartdoc', () => {
    it('should parse basic dartdoc comment', () => {
      const dartdoc = `/// This is a description
/// [name] The name parameter
/// Returns String: The result`;

      const result = parseDartdoc(dartdoc);

      expect(result.description).toBe('This is a description');
      expect(result.params).toHaveLength(1);
      expect(result.params[0].name).toBe('name');
      expect(result.returns?.description).toBe('The result');
    });

    it('should parse dartdoc with examples', () => {
      const dartdoc = `/// Calculate sum
/// Example:
/// \`\`\`dart
/// final result = sum(1, 2);
/// print(result); // 3
/// \`\`\``;

      const result = parseDartdoc(dartdoc);

      expect(result.examples).toHaveLength(1);
      expect(result.examples[0]).toContain('sum(1, 2)');
    });

    it('should parse dartdoc with deprecated annotation', () => {
      const dartdoc = `/// Old method
/// @Deprecated('Use newMethod instead')`;

      const result = parseDartdoc(dartdoc);

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('deprecated');
      expect(result.tags[0].value).toBe('Use newMethod instead');
    });
  });

  describe('jsdocToDartdoc', () => {
    it('should convert JSDoc to dartdoc', () => {
      const jsdoc = `/**
       * Calculate the sum of two numbers
       * @param {number} a - First number
       * @param {number} b - Second number
       * @returns {number} The sum
       */`;

      const result = jsdocToDartdoc(jsdoc);

      expect(result).toContain('/// Calculate the sum of two numbers');
      expect(result).toContain('/// [a] First number (num)');
      expect(result).toContain('/// [b] Second number (num)');
      expect(result).toContain('/// Returns num: The sum');
    });

    it('should convert JSDoc with examples', () => {
      const jsdoc = `/**
       * Process data
       * @example
       * const result = process('test');
       */`;

      const result = jsdocToDartdoc(jsdoc);

      expect(result).toContain('/// Example:');
      expect(result).toContain('/// ```dart');
      expect(result).toContain('/// final result = process(\'test\');');
      expect(result).toContain('/// ```');
    });

    it('should convert deprecated tag', () => {
      const jsdoc = `/**
       * Old method
       * @deprecated Use newMethod instead
       */`;

      const result = jsdocToDartdoc(jsdoc);

      expect(result).toContain("/// @Deprecated('Use newMethod instead')");
    });
  });

  describe('dartdocToJSDoc', () => {
    it('should convert dartdoc to JSDoc', () => {
      const dartdoc = `/// Calculate the sum of two numbers
/// [a] First number (num)
/// [b] Second number (num)
/// Returns num: The sum`;

      const result = dartdocToJSDoc(dartdoc);

      expect(result).toContain('/**');
      expect(result).toContain(' * Calculate the sum of two numbers');
      expect(result).toContain(' * @param {number} a - First number');
      expect(result).toContain(' * @param {number} b - Second number');
      expect(result).toContain(' * @returns {number} The sum');
      expect(result).toContain(' */');
    });

    it('should convert dartdoc with examples', () => {
      const dartdoc = `/// Process data
/// Example:
/// \`\`\`dart
/// final result = process('test');
/// print(result);
/// \`\`\``;

      const result = dartdocToJSDoc(dartdoc);

      expect(result).toContain(' * @example');
      expect(result).toContain(" * const result = process('test');");
      expect(result).toContain(' * console.log(result);');
    });

    it('should convert deprecated annotation', () => {
      const dartdoc = `/// Old method
/// @Deprecated('Use newMethod instead')`;

      const result = dartdocToJSDoc(dartdoc);

      expect(result).toContain(' * @deprecated Use newMethod instead');
    });
  });

  describe('extractInlineComments', () => {
    it('should extract single-line comments', () => {
      const code = `const x = 1; // This is a comment
const y = 2; // Another comment`;

      const result = extractInlineComments(code);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('This is a comment');
      expect(result[0].line).toBe(1);
      expect(result[0].type).toBe('single');
      expect(result[1].text).toBe('Another comment');
      expect(result[1].line).toBe(2);
    });

    it('should extract block comments', () => {
      const code = `const x = 1; /* inline block */
const y = 2;`;

      const result = extractInlineComments(code);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('inline block');
      expect(result[0].type).toBe('block');
    });

    it('should handle code without comments', () => {
      const code = `const x = 1;
const y = 2;`;

      const result = extractInlineComments(code);

      expect(result).toHaveLength(0);
    });
  });

  describe('Type conversion', () => {
    it('should convert JS types to Dart types', () => {
      const jsdoc = `/**
       * @param {string} name
       * @param {number} age
       * @param {boolean} active
       * @param {Array<string>} tags
       * @returns {Promise<object>} The result
       */`;

      const result = jsdocToDartdoc(jsdoc);

      expect(result).toContain('(String)');
      expect(result).toContain('(num)');
      expect(result).toContain('(bool)');
      expect(result).toContain('(List<String>)');
      expect(result).toContain('Returns Future<Map<String, dynamic>>: The result');
    });

    it('should convert Dart types to JS types', () => {
      const dartdoc = `/// [name] Name (String)
/// [age] Age (int)
/// [active] Active (bool)
/// [tags] Tags (List<String>)
/// Returns Future<Map<String, dynamic>>: The result`;

      const result = dartdocToJSDoc(dartdoc);

      expect(result).toContain('{string} name');
      expect(result).toContain('{number} age');
      expect(result).toContain('{boolean} active');
      expect(result).toContain('{Array<string>} tags');
      expect(result).toContain('{Promise<Record<string, any>>}');
    });
  });
});
