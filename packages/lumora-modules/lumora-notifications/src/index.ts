/**
 * @lumora/notifications - Notifications module for Lumora
 * Send local notifications and handle push notifications
 */

import {
  createNativeModule,
  createModuleProxy,
  defineMethod,
  PermissionStatus,
} from '@lumora/native-bridge';

// Module definition
export const NotificationsModule = createNativeModule({
  name: 'LumoraNotifications',
  methods: [
    defineMethod({
      name: 'requestPermissions',
      returnType: 'Promise<PermissionStatus>',
      description: 'Request notification permissions',
    }),
    defineMethod({
      name: 'scheduleNotification',
      parameters: [
        { name: 'notification', type: 'NotificationContent' },
        { name: 'trigger', type: 'NotificationTrigger', optional: true },
      ],
      returnType: 'Promise<string>',
      description: 'Schedule a local notification',
    }),
    defineMethod({
      name: 'cancelNotification',
      parameters: [{ name: 'id', type: 'string' }],
      returnType: 'Promise<void>',
      description: 'Cancel a scheduled notification',
    }),
    defineMethod({
      name: 'cancelAllNotifications',
      returnType: 'Promise<void>',
      description: 'Cancel all notifications',
    }),
    defineMethod({
      name: 'getNotificationToken',
      returnType: 'Promise<string>',
      description: 'Get push notification token',
    }),
    defineMethod({
      name: 'setBadgeCount',
      parameters: [{ name: 'count', type: 'number' }],
      returnType: 'Promise<void>',
      description: 'Set app badge count',
    }),
  ],
  events: [
    'notificationReceived',
    'notificationTapped',
    'tokenRefreshed',
  ],
  description: 'Handle local and push notifications',
});

// Types
export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  categoryId?: string;
  threadId?: string;
}

export interface NotificationTrigger {
  type: 'timeInterval' | 'calendar' | 'location';
  seconds?: number;
  repeats?: boolean;
  date?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface NotificationResponse {
  id: string;
  notification: NotificationContent;
  actionId?: string;
}

// API
export interface NotificationsAPI {
  requestPermissions(): Promise<PermissionStatus>;
  scheduleNotification(
    notification: NotificationContent,
    trigger?: NotificationTrigger
  ): Promise<string>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  getNotificationToken(): Promise<string>;
  setBadgeCount(count: number): Promise<void>;
  addListener(
    event: 'notificationReceived',
    callback: (notification: NotificationContent) => void
  ): () => void;
  addListener(
    event: 'notificationTapped',
    callback: (response: NotificationResponse) => void
  ): () => void;
  addListener(
    event: 'tokenRefreshed',
    callback: (token: string) => void
  ): () => void;
}

// Create and export proxy
export const Notifications = createModuleProxy<NotificationsAPI>('LumoraNotifications');

// Default export
export default Notifications;
