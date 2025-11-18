/**
 * @lumora/network - Network module for Lumora
 * Monitor network connectivity and get network information
 */
export declare const NetworkModule: import("@lumora/native-bridge").NativeModule;
export declare enum NetworkStateType {
    /** No network connection */
    NONE = "NONE",
    /** Unknown network type */
    UNKNOWN = "UNKNOWN",
    /** Cellular connection (2G, 3G, 4G, 5G) */
    CELLULAR = "CELLULAR",
    /** WiFi connection */
    WIFI = "WIFI",
    /** Bluetooth connection */
    BLUETOOTH = "BLUETOOTH",
    /** Ethernet connection */
    ETHERNET = "ETHERNET",
    /** WiMAX connection */
    WIMAX = "WIMAX",
    /** VPN connection */
    VPN = "VPN",
    /** Other connection type */
    OTHER = "OTHER"
}
export declare enum CellularGeneration {
    /** Unknown cellular generation */
    UNKNOWN = "0",
    /** 2G network */
    TWO_G = "2g",
    /** 3G network */
    THREE_G = "3g",
    /** 4G network */
    FOUR_G = "4g",
    /** 5G network */
    FIVE_G = "5g"
}
export interface NetworkState {
    /** Network connection type */
    type: NetworkStateType;
    /** Whether device is connected to internet */
    isConnected: boolean;
    /** Whether connection is metered/expensive */
    isInternetReachable: boolean;
    /** Cellular generation (if type is CELLULAR) */
    cellularGeneration?: CellularGeneration;
    /** Additional details */
    details?: NetworkStateDetails;
}
export interface NetworkStateDetails {
    /** Is connection metered (counts against data plan) */
    isConnectionExpensive?: boolean;
    /** WiFi SSID (if type is WIFI, may be null on iOS) */
    ssid?: string;
    /** WiFi BSSID */
    bssid?: string;
    /** Signal strength (0-100) */
    strength?: number;
    /** IP address */
    ipAddress?: string;
    /** Subnet mask */
    subnet?: string;
}
export interface NetworkAPI {
    /**
     * Get current network state
     */
    getNetworkStateAsync(): Promise<NetworkState>;
    /**
     * Get device IP address
     */
    getIpAddressAsync(): Promise<string>;
    /**
     * Check if airplane mode is enabled
     */
    isAirplaneModeEnabledAsync(): Promise<boolean>;
    /**
     * Listen to network state changes
     */
    addListener(event: 'networkStateChange', callback: (state: NetworkState) => void): () => void;
}
export declare const Network: NetworkAPI;
export default Network;
export { NetworkStateType as NetworkType };
//# sourceMappingURL=index.d.ts.map