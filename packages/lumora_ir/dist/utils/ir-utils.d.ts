import { LumoraIR, LumoraNode, IRMetadata } from '../types/ir-types';
/**
 * Create a new Lumora IR structure
 */
export declare function createIR(metadata: IRMetadata, nodes?: LumoraNode[]): LumoraIR;
/**
 * Create a new Lumora node
 */
export declare function createNode(type: string, props?: Record<string, any>, children?: LumoraNode[], lineNumber?: number): LumoraNode;
/**
 * Generate unique node ID
 */
export declare function generateNodeId(): string;
/**
 * Clone IR deeply
 */
export declare function cloneIR(ir: LumoraIR): LumoraIR;
/**
 * Clone node deeply
 */
export declare function cloneNode(node: LumoraNode): LumoraNode;
/**
 * Find node by ID in IR tree
 */
export declare function findNodeById(nodes: LumoraNode[], id: string): LumoraNode | null;
/**
 * Find all nodes of a specific type
 */
export declare function findNodesByType(nodes: LumoraNode[], type: string): LumoraNode[];
/**
 * Count total nodes in tree
 */
export declare function countNodes(nodes: LumoraNode[]): number;
/**
 * Get maximum depth of node tree
 */
export declare function getMaxDepth(nodes: LumoraNode[]): number;
/**
 * Traverse IR tree with visitor pattern
 */
export declare function traverseNodes(nodes: LumoraNode[], visitor: (node: LumoraNode, depth: number) => void, depth?: number): void;
