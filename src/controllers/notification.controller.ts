import { notificationService } from "../services/notification.service.js";
import { handleError } from "../utils/error.util.js";
import { ResponseUtil } from "../utils/response.util.js";
import {
  RegisterFCMTokenRequest,
  GetNotificationsQuery,
  MarkAsReadRequest,
} from "../types/notification.type.js";

export const notificationController = {
  /**
   * Register or update FCM token for push notifications
   */
  async registerFCMToken(data: RegisterFCMTokenRequest, context: any) {
    try {
      const userId = context.user._id;
      await notificationService.registerFCMToken(userId, data.fcm_token);
      return ResponseUtil.success(
        { userId, registered: true },
        "FCM token registered successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Remove FCM token (e.g., on logout)
   */
  async removeFCMToken(context: any) {
    try {
      const userId = context.user._id;
      await notificationService.removeFCMToken(userId);
      return ResponseUtil.success(
        { userId, removed: true },
        "FCM token removed successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Get user's notifications with pagination
   */
  async getNotifications(query: GetNotificationsQuery, context: any) {
    try {
      const userId = context.user._id;
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 20, 100);

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit
      );

      return ResponseUtil.successWithPagination(
        result.notifications,
        result.pagination,
        "Notifications retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(data: MarkAsReadRequest, context: any) {
    try {
      const userId = context.user._id;
      await notificationService.markAsRead(data.notification_id, userId);
      return ResponseUtil.success(
        { notification_id: data.notification_id },
        "Notification marked as read"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(context: any) {
    try {
      const userId = context.user._id;
      await notificationService.markAllAsRead(userId);
      return ResponseUtil.success(
        { userId },
        "All notifications marked as read"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },
};

