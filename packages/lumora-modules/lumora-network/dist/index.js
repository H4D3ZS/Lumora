"use strict";
/**
 * @lumora/network - Network module for Lumora
 * Monitor network connectivity and get network information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkType = exports.Network = exports.CellularGeneration = exports.NetworkStateType = exports.NetworkModule = void 0;
const native_bridge_1 = require("@lumora/native-bridge");
// Module definition
exports.NetworkModule = (0, native_bridge_1.createNativeModule)({
    name: 'LumoraNetwork',
    methods: [
        // Network state
        (0, native_bridge_1.defineMethod)({
            name: 'getNetworkStateAsync',
            returnType: 'Promise<NetworkState>',
            description: 'Get current network state',
        }),
        (0, native_bridge_1.defineMethod)({
            name: 'getIpAddressAsync',
            returnType: 'Promise<string>',
            description: 'Get device IP address',
        }),
        // Airplane mode
        (0, native_bridge_1.defineMethod)({
            name: 'isAirplaneModeEnabledAsync',
            returnType: 'Promise<boolean>',
            description: 'Check if airplane mode is enabled',
        }),
    ],
    events: ['networkStateChange'],
    description: 'Monitor network connectivity and status',
});
// Types
var NetworkStateType;
(function (NetworkStateType) {
    /** No network connection */
    NetworkStateType["NONE"] = "NONE";
    /** Unknown network type */
    NetworkStateType["UNKNOWN"] = "UNKNOWN";
    /** Cellular connection (2G, 3G, 4G, 5G) */
    NetworkStateType["CELLULAR"] = "CELLULAR";
    /** WiFi connection */
    NetworkStateType["WIFI"] = "WIFI";
    /** Bluetooth connection */
    NetworkStateType["BLUETOOTH"] = "BLUETOOTH";
    /** Ethernet connection */
    NetworkStateType["ETHERNET"] = "ETHERNET";
    /** WiMAX connection */
    NetworkStateType["WIMAX"] = "WIMAX";
    /** VPN connection */
    NetworkStateType["VPN"] = "VPN";
    /** Other connection type */
    NetworkStateType["OTHER"] = "OTHER";
})(NetworkStateType || (exports.NetworkType = exports.NetworkStateType = NetworkStateType = {}));
var CellularGeneration;
(function (CellularGeneration) {
    /** Unknown cellular generation */
    CellularGeneration["UNKNOWN"] = "0";
    /** 2G network */
    CellularGeneration["TWO_G"] = "2g";
    /** 3G network */
    CellularGeneration["THREE_G"] = "3g";
    /** 4G network */
    CellularGeneration["FOUR_G"] = "4g";
    /** 5G network */
    CellularGeneration["FIVE_G"] = "5g";
})(CellularGeneration || (exports.CellularGeneration = CellularGeneration = {}));
// Create and export proxy
exports.Network = (0, native_bridge_1.createModuleProxy)('LumoraNetwork');
// Default export
exports.default = exports.Network;
//# sourceMappingURL=index.js.map