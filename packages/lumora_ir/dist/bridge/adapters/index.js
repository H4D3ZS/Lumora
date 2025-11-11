"use strict";
/**
 * State Adapters Module
 * Exports all state management adapters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderAdapter = exports.RiverpodAdapter = exports.BlocAdapter = exports.BaseStateAdapter = void 0;
exports.getAdapter = getAdapter;
exports.getAllAdapters = getAllAdapters;
exports.isValidAdapterType = isValidAdapterType;
var base_adapter_1 = require("./base-adapter");
Object.defineProperty(exports, "BaseStateAdapter", { enumerable: true, get: function () { return base_adapter_1.BaseStateAdapter; } });
var bloc_adapter_1 = require("./bloc-adapter");
Object.defineProperty(exports, "BlocAdapter", { enumerable: true, get: function () { return bloc_adapter_1.BlocAdapter; } });
var riverpod_adapter_1 = require("./riverpod-adapter");
Object.defineProperty(exports, "RiverpodAdapter", { enumerable: true, get: function () { return riverpod_adapter_1.RiverpodAdapter; } });
var provider_adapter_1 = require("./provider-adapter");
Object.defineProperty(exports, "ProviderAdapter", { enumerable: true, get: function () { return provider_adapter_1.ProviderAdapter; } });
const bloc_adapter_2 = require("./bloc-adapter");
const riverpod_adapter_2 = require("./riverpod-adapter");
const provider_adapter_2 = require("./provider-adapter");
/**
 * Get adapter by name
 */
function getAdapter(type) {
    switch (type) {
        case 'bloc':
            return new bloc_adapter_2.BlocAdapter();
        case 'riverpod':
            return new riverpod_adapter_2.RiverpodAdapter();
        case 'provider':
            return new provider_adapter_2.ProviderAdapter();
        default:
            throw new Error(`Unknown adapter type: ${type}`);
    }
}
/**
 * Get all available adapters
 */
function getAllAdapters() {
    return [
        new bloc_adapter_2.BlocAdapter(),
        new riverpod_adapter_2.RiverpodAdapter(),
        new provider_adapter_2.ProviderAdapter(),
    ];
}
/**
 * Check if adapter type is valid
 */
function isValidAdapterType(type) {
    return ['bloc', 'riverpod', 'provider'].includes(type);
}
