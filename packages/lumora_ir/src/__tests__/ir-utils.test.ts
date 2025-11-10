import {
  createIR,
  createNode,
  generateNodeId,
  cloneIR,
  cloneNode,
  findNodeById,
  findNodesByType,
  countNodes,
  getMaxDepth,
  traverseNodes,
} from '../utils/ir-utils';
import { LumoraIR, LumoraNode } from '../types/ir-types';

describe('IR Utils', () => {
  describe('createIR', () => {
    it('should create valid IR structure', () => {
      const ir = createIR({
        sourceFramework: 'react',
        sourceFile: 'test.tsx',
        generatedAt: Date.now(),
      });

      expect(ir.version).toBe('1.0.0');
      expect(ir.metadata.sourceFramework).toBe('react');
      expect(ir.metadata.irVersion).toBe('1.0.0');
      expect(Array.isArray(ir.nodes)).toBe(true);
    });

    it('should accept nodes parameter', () => {
      const node = createNode('Container');
      const ir = createIR(
        {
          sourceFramework: 'flutter',
          sourceFile: 'test.dart',
          generatedAt: Date.now(),
        },
        [node]
      );

      expect(ir.nodes.length).toBe(1);
      expect(ir.nodes[0]).toEqual(node);
    });
  });

  describe('createNode', () => {
    it('should create valid node', () => {
      const node = createNode('Container', { width: 100 }, [], 10);

      expect(node.id).toBeDefined();
      expect(node.type).toBe('Container');
      expect(node.props.width).toBe(100);
      expect(Array.isArray(node.children)).toBe(true);
      expect(node.metadata.lineNumber).toBe(10);
    });

    it('should use default values', () => {
      const node = createNode('Text');

      expect(node.props).toEqual({});
      expect(node.children).toEqual([]);
      expect(node.metadata.lineNumber).toBe(0);
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^node_\d+_[a-z0-9]+$/);
    });
  });

  describe('cloneIR', () => {
    it('should create deep copy of IR', () => {
      const original = createIR(
        {
          sourceFramework: 'react',
          sourceFile: 'test.tsx',
          generatedAt: Date.now(),
        },
        [createNode('Container')]
      );

      const cloned = cloneIR(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nodes[0]).not.toBe(original.nodes[0]);
    });
  });

  describe('cloneNode', () => {
    it('should create deep copy of node', () => {
      const original = createNode('Container', { width: 100 }, [
        createNode('Text'),
      ]);

      const cloned = cloneNode(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.children[0]).not.toBe(original.children[0]);
    });
  });

  describe('findNodeById', () => {
    it('should find node by ID', () => {
      const child = createNode('Text');
      const parent = createNode('Container', {}, [child]);
      const nodes = [parent];

      const found = findNodeById(nodes, child.id);
      expect(found).toEqual(child);
    });

    it('should return null if not found', () => {
      const nodes = [createNode('Container')];
      const found = findNodeById(nodes, 'non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findNodesByType', () => {
    it('should find all nodes of specific type', () => {
      const nodes = [
        createNode('Container', {}, [
          createNode('Text'),
          createNode('Button'),
        ]),
        createNode('Text'),
      ];

      const textNodes = findNodesByType(nodes, 'Text');
      expect(textNodes.length).toBe(2);
      expect(textNodes.every(n => n.type === 'Text')).toBe(true);
    });

    it('should return empty array if type not found', () => {
      const nodes = [createNode('Container')];
      const found = findNodesByType(nodes, 'NonExistent');
      expect(found).toEqual([]);
    });
  });

  describe('countNodes', () => {
    it('should count all nodes in tree', () => {
      const nodes = [
        createNode('Container', {}, [
          createNode('Text'),
          createNode('Button', {}, [createNode('Text')]),
        ]),
        createNode('Text'),
      ];

      const count = countNodes(nodes);
      expect(count).toBe(5);
    });

    it('should return 0 for empty array', () => {
      const count = countNodes([]);
      expect(count).toBe(0);
    });
  });

  describe('getMaxDepth', () => {
    it('should calculate maximum depth', () => {
      const nodes = [
        createNode('Container', {}, [
          createNode('Text'),
          createNode('Button', {}, [
            createNode('Text', {}, [createNode('Icon')]),
          ]),
        ]),
      ];

      const depth = getMaxDepth(nodes);
      expect(depth).toBe(4);
    });

    it('should return 0 for empty array', () => {
      const depth = getMaxDepth([]);
      expect(depth).toBe(0);
    });

    it('should return 1 for single level', () => {
      const nodes = [createNode('Container')];
      const depth = getMaxDepth(nodes);
      expect(depth).toBe(1);
    });
  });

  describe('traverseNodes', () => {
    it('should visit all nodes', () => {
      const nodes = [
        createNode('Container', {}, [
          createNode('Text'),
          createNode('Button'),
        ]),
      ];

      const visited: string[] = [];
      traverseNodes(nodes, (node) => {
        visited.push(node.type);
      });

      expect(visited).toEqual(['Container', 'Text', 'Button']);
    });

    it('should provide correct depth', () => {
      const nodes = [
        createNode('Container', {}, [
          createNode('Text', {}, [createNode('Icon')]),
        ]),
      ];

      const depths: number[] = [];
      traverseNodes(nodes, (_, depth) => {
        depths.push(depth);
      });

      expect(depths).toEqual([0, 1, 2]);
    });
  });
});
