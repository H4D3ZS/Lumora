"use strict";
/**
 * Lumora Network Schema Type Definitions
 * Framework-agnostic intermediate representation for network operations
 *
 * This schema supports conversion between:
 * - React: fetch, axios, React Query, SWR
 * - Flutter: http package, dio, GraphQL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_PRESETS = void 0;
/**
 * Common network presets
 */
exports.NETWORK_PRESETS = {
    restAPI: {
        name: 'REST API',
        description: 'Standard REST API configuration',
        config: {
            timeout: 30000,
            defaultHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            caching: {
                enabled: true,
                defaultStrategy: 'network-first',
                defaultTTL: 300000, // 5 minutes
                storage: 'memory'
            },
            retry: {
                enabled: true,
                strategy: 'exponential',
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
                retryOnNetworkError: true,
                retryOnTimeout: true
            }
        }
    },
    graphQL: {
        name: 'GraphQL API',
        description: 'GraphQL API configuration',
        config: {
            timeout: 30000,
            defaultHeaders: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            caching: {
                enabled: true,
                defaultStrategy: 'cache-first',
                defaultTTL: 600000, // 10 minutes
                storage: 'memory'
            }
        }
    },
    noCache: {
        name: 'No Cache',
        description: 'Configuration with caching disabled',
        config: {
            timeout: 30000,
            caching: {
                enabled: false
            }
        }
    },
    aggressive: {
        name: 'Aggressive Caching',
        description: 'Aggressive caching for static content',
        config: {
            timeout: 30000,
            caching: {
                enabled: true,
                defaultStrategy: 'cache-first',
                defaultTTL: 3600000, // 1 hour
                storage: 'disk'
            }
        }
    }
};
//# sourceMappingURL=network-types.js.map