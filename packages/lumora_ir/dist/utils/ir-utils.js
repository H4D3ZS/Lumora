"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIR = createIR;
exports.createNode = createNode;
exports.generateNodeId = generateNodeId;
exports.cloneIR = cloneIR;
exports.cloneNode = cloneNode;
exports.findNodeById = findNodeById;
exports.findNodesByType = findNodesByType;
exports.countNodes = countNodes;
exports.getMaxDepth = getMaxDepth;
exports.traverseNodes = traverseNodes;
/**
 * Create a new Lumora IR structure
 */
function createIR(metadata, nodes = []) {
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
function createNode(type, props = {}, children = [], lineNumber = 0) {
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
function generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Clone IR deeply
 */
function cloneIR(ir) {
    return JSON.parse(JSON.stringify(ir));
}
/**
 * Clone node deeply
 */
function cloneNode(node) {
    return JSON.parse(JSON.stringify(node));
}
/**
 * Find node by ID in IR tree
 */
function findNodeById(nodes, id) {
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
function findNodesByType(nodes, type) {
    const results = [];
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
function countNodes(nodes) {
    let count = nodes.length;
    for (const node of nodes) {
        count += countNodes(node.children);
    }
    return count;
}
/**
 * Get maximum depth of node tree
 */
function getMaxDepth(nodes) {
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
function traverseNodes(nodes, visitor, depth = 0) {
    for (const node of nodes) {
        visitor(node, depth);
        traverseNodes(node.children, visitor, depth + 1);
    }
}
