import { ConflictRecord } from './conflict-detector';
/**
 * Notification channel types
 */
export declare enum NotificationChannel {
    CLI = "cli",
    WEB_DASHBOARD = "web_dashboard",
    VSCODE_EXTENSION = "vscode_extension"
}
/**
 * Notification message
 */
export interface ConflictNotification {
    conflict: ConflictRecord;
    channel: NotificationChannel;
    timestamp: number;
    message: string;
    severity: 'warning' | 'error';
}
/**
 * Notification handler function type
 */
export type NotificationHandler = (notification: ConflictNotification) => void;
/**
 * Conflict Notifier
 * Sends notifications about conflicts to various channels
 */
export declare class ConflictNotifier {
    private handlers;
    private notificationHistory;
    private maxHistorySize;
    constructor();
    /**
     * Send CLI notification
     */
    sendCLINotification(conflict: ConflictRecord): void;
    /**
     * Send web dashboard notification
     */
    sendWebDashboardNotification(conflict: ConflictRecord): void;
    /**
     * Send VS Code extension notification
     */
    sendVSCodeNotification(conflict: ConflictRecord): void;
    /**
     * Send notification to all channels
     */
    notifyAll(conflict: ConflictRecord): void;
    /**
     * Register notification handler for a channel
     */
    registerHandler(channel: NotificationChannel, handler: NotificationHandler): void;
    /**
     * Unregister notification handler
     */
    unregisterHandler(channel: NotificationChannel, handler: NotificationHandler): void;
    /**
     * Get notification history
     */
    getHistory(limit?: number): ConflictNotification[];
    /**
     * Clear notification history
     */
    clearHistory(): void;
    /**
     * Notify handlers for a specific channel
     */
    private notifyChannel;
    /**
     * Add notification to history
     */
    private addToHistory;
    /**
     * Format CLI message
     */
    private formatCLIMessage;
    /**
     * Format web dashboard message
     */
    private formatWebDashboardMessage;
    /**
     * Format VS Code message
     */
    private formatVSCodeMessage;
    /**
     * Format notification for JSON output (useful for web dashboard)
     */
    formatForJSON(notification: ConflictNotification): object;
}
