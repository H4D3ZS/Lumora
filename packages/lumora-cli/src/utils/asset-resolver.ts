
import { LumoraIR, LumoraNode } from 'lumora-ir';

/**
 * Resolves relative asset paths in Lumora IR to absolute URLs
 * pointing to the Dev Proxy Server.
 */
export function resolveAssetPaths(ir: LumoraIR, baseUrl: string): LumoraIR {
    // Deep clone to avoid mutating original IR
    const newIR = JSON.parse(JSON.stringify(ir));

    newIR.nodes = newIR.nodes.map((node: LumoraNode) => resolveNodeAssets(node, baseUrl));

    return newIR;
}

function resolveNodeAssets(node: LumoraNode, baseUrl: string): LumoraNode {
    // Resolve props
    if (node.props) {
        for (const [key, value] of Object.entries(node.props)) {
            if (shouldResolveProp(key) && typeof value === 'string') {
                node.props[key] = resolveUrl(value, baseUrl);
            }
        }
    }

    // Resolve children recursively
    if (node.children) {
        node.children = node.children.map(child => resolveNodeAssets(child, baseUrl));
    }

    return node;
}

function shouldResolveProp(key: string): boolean {
    const assetProps = ['src', 'source', 'image', 'icon', 'backgroundImage', 'uri', 'url'];
    return assetProps.includes(key);
}

function resolveUrl(url: string, baseUrl: string): string {
    // Skip data URLs, http/https URLs
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Clean path
    let cleanPath = url;
    if (cleanPath.startsWith('./')) {
        cleanPath = cleanPath.substring(2);
    } else if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }

    // Construct absolute URL
    // Ensure baseUrl doesn't end with slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    return `${cleanBaseUrl}/${cleanPath}`;
}
