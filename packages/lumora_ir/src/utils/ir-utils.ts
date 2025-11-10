import { LumoraIR, LumoraNode, IRMetadata } from '../types/ir-types';

/**
 * Create a new Lumora IR structure
 */
export function createIR(
  metadata: IRMetadata,
  nodes: LumoraNode[] = []
): LumoraIR {
  return {
    version: '1.0.0',
    metadata: {
      ...metadata,
      generatedAt: metadata.generatedAt || Date.now(),
      irVersion: '1.0.0',
    },
    nodes,
  };
}

/**
 * Create a new Lumora node
 */
export function createNode(
  type: string,
  props: Record<string, any> = {},
  children: LumoraNode[] = [],
  lineNumber: number = 0
): LumoraNode {
  return {
    id: generateNodeId(),
    type,
    props,
    children,
    metadata: {
      lineNumber,
    },
  };
}

/**
 * Generate unique node ID
 */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clone IR deeply
 */
export function cloneIR(ir: LumoraIR): LumoraIR {
  return JSON.parse(JSON.stringify(ir));
}

/**
 * Clone node deeply
 */
export function cloneNode(node: LumoraNode): LumoraNode {
  return JSON.parse(JSON.stringify(node));
}

/**
 * Find node by ID in IR tree
 */
export function findNodeById(
  nodes: LumoraNode[],
  id: string
): LumoraNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findNodeById(node.children, id);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Find all nodes of a specific type
 */
export function findNodesByType(
  nodes: LumoraNode[],
  type: string
): LumoraNode[] {
  const results: LumoraNode[] = [];

  for (const node of nodes) {
    if (node.type === type) {
      results.push(node);
    }

    results.push(...findNodesByType(node.children, type));
  }

  return results;
}

/**
 * Count total nodes in tree
 */
export function countNodes(nodes: LumoraNode[]): number {
  let count = nodes.length;

  for (const node of nodes) {
    count += countNodes(node.children);
  }

  return count;
}

/**
 * Get maximum depth of node tree
 */
export function getMaxDepth(nodes: LumoraNode[]): number {
  if (nodes.length === 0) {
    return 0;
  }

  let maxDepth = 1;

  for (const node of nodes) {
    const childDepth = getMaxDepth(node.children);
    maxDepth = Math.max(maxDepth, 1 + childDepth);
  }

  return maxDepth;
}

/**
 * Traverse IR tree with visitor pattern
 */
export function traverseNodes(
  nodes: LumoraNode[],
  visitor: (node: LumoraNode, depth: number) => void,
  depth: number = 0
): void {
  for (const node of nodes) {
    visitor(node, depth);
    traverseNodes(node.children, visitor, depth + 1);
  }
}
