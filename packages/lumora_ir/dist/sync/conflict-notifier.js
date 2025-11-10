"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictNotifier = exports.NotificationChannel = void 0;
/**
 * Notification channel types
 */
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["CLI"] = "cli";
    NotificationChannel["WEB_DASHBOARD"] = "web_dashboard";
    NotificationChannel["VSCODE_EXTENSION"] = "vscode_extension";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
/**
 * Conflict Notifier
 * Sends notifications about conflicts to various channels
 */
class ConflictNotifier {
    constructor() {
        this.handlers = new Map();
        this.notificationHistory = [];
        this.maxHistorySize = 100;
        // Initialize handler arrays for each channel
        this.handlers.set(NotificationChannel.CLI, []);
        this.handlers.set(NotificationChannel.WEB_DASHBOARD, []);
        this.handlers.set(NotificationChannel.VSCODE_EXTENSION, []);
    }
    /**
     * Send CLI notification
     */
    sendCLINotification(conflict) {
        const message = this.formatCLIMessage(conflict);
        const notification = {
            conflict,
            channel: NotificationChannel.CLI,
            timestamp: Date.now(),
            message,
            severity: 'warning',
        };
        this.notifyChannel(NotificationChannel.CLI, notification);
        this.addToHistory(notification);
    }
    /**
     * Send web dashboard notification
     */
    sendWebDashboardNotification(conflict) {
        const message = this.formatWebDashboardMessage(conflict);
        const notification = {
            conflict,
            channel: NotificationChannel.WEB_DASHBOARD,
            timestamp: Date.now(),
            message,
            severity: 'warning',
        };
        this.notifyChannel(NotificationChannel.WEB_DASHBOARD, notification);
        this.addToHistory(notification);
    }
    /**
     * Send VS Code extension notification
     */
    sendVSCodeNotification(conflict) {
        const message = this.formatVSCodeMessage(conflict);
        const notification = {
            conflict,
            channel: NotificationChannel.VSCODE_EXTENSION,
            timestamp: Date.now(),
            message,
            severity: 'warning',
        };
        this.notifyChannel(NotificationChannel.VSCODE_EXTENSION, notification);
        this.addToHistory(notification);
    }
    /**
     * Send notification to all channels
     */
    notifyAll(conflict) {
        this.sendCLINotification(conflict);
        this.sendWebDashboardNotification(conflict);
        this.sendVSCodeNotification(conflict);
    }
    /**
     * Register notification handler for a channel
     */
    registerHandler(channel, handler) {
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
            channelHandlers.push(handler);
        }
    }
    /**
     * Unregister notification handler
     */
    unregisterHandler(channel, handler) {
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
            const index = channelHandlers.indexOf(handler);
            if (index !== -1) {
                channelHandlers.splice(index, 1);
            }
        }
    }
    /**
     * Get notification history
     */
    getHistory(limit) {
        if (limit) {
            return this.notificationHistory.slice(-limit);
        }
        return [...this.notificationHistory];
    }
    /**
     * Clear notification history
     */
    clearHistory() {
        this.notificationHistory = [];
    }
    /**
     * Notify handlers for a specific channel
     */
    notifyChannel(channel, notification) {
        const channelHandlers = this.handlers.get(channel);
        if (channelHandlers) {
            for (const handler of channelHandlers) {
                try {
                    handler(notification);
                }
                catch (error) {
                    console.error(`Error in ${channel} notification handler:`, error);
                }
            }
        }
    }
    /**
     * Add notification to history
     */
    addToHistory(notification) {
        this.notificationHistory.push(notification);
        // Trim history if it exceeds max size
        if (this.notificationHistory.length > this.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
        }
    }
    /**
     * Format CLI message
     */
    formatCLIMessage(conflict) {
        const reactTime = new Date(conflict.reactTimestamp).toLocaleTimeString();
        const flutterTime = new Date(conflict.flutterTimestamp).toLocaleTimeString();
        return `
⚠️  CONFLICT DETECTED

ID: ${conflict.id}
React File: ${conflict.reactFile} (modified at ${reactTime})
Flutter File: ${conflict.flutterFile} (modified at ${flutterTime})
IR Version: ${conflict.irVersion}

Both files were modified simultaneously. Please resolve the conflict.
Run 'lumora resolve ${conflict.id}' to resolve.
`;
    }
    /**
     * Format web dashboard message
     */
    formatWebDashboardMessage(conflict) {
        return `Conflict detected: ${conflict.reactFile} ↔ ${conflict.flutterFile}`;
    }
    /**
     * Format VS Code message
     */
    formatVSCodeMessage(conflict) {
        return `Lumora: Conflict detected between ${conflict.reactFile} and ${conflict.flutterFile}`;
    }
    /**
     * Format notification for JSON output (useful for web dashboard)
     */
    formatForJSON(notification) {
        return {
            id: notification.conflict.id,
            channel: notification.channel,
            timestamp: notification.timestamp,
            message: notification.message,
            severity: notification.severity,
            conflict: {
                reactFile: notification.conflict.reactFile,
                flutterFile: notification.conflict.flutterFile,
                reactTimestamp: notification.conflict.reactTimestamp,
                flutterTimestamp: notification.conflict.flutterTimestamp,
                irVersion: notification.conflict.irVersion,
                detectedAt: notification.conflict.detectedAt,
                resolved: notification.conflict.resolved,
            },
        };
    }
}
exports.ConflictNotifier = ConflictNotifier;
