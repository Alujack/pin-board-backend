import { messaging } from '../config/firebase.config.js';
import { notificationModel } from '../models/notification.model.js';
import { userModel } from '../models/user.model.js';
import { NotificationTypeEnum } from '../types/enums.js';

export interface NotificationData {
  userId: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const notificationService = {
  /**
   * Send push notification via Firebase Cloud Messaging
   */
  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: fcmToken,
      };

      const response = await messaging.send(message);
      console.log('✅ Successfully sent push notification:', response);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending push notification:', error);
      // If token is invalid, we might want to remove it from user
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.warn('⚠️ Invalid FCM token detected');
      }
      return false;
    }
  },

  /**
   * Create notification record and send push notification
   */
  async createAndSendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Get user's FCM token
      const user = await userModel.findById(notificationData.userId);
      if (!user) {
        console.warn('⚠️ User not found for notification:', notificationData.userId);
        return;
      }

      // Create notification record in database
      await notificationModel.create({
        user: notificationData.userId,
        type: notificationData.type,
        content: notificationData.body,
        is_read: false,
        metadata: notificationData.data,
      });

      // Send push notification if user has FCM token
      if (user.fcm_token) {
        await this.sendPushNotification(
          user.fcm_token,
          notificationData.title,
          notificationData.body,
          notificationData.data
        );
      } else {
        console.log('ℹ️ User has no FCM token, notification saved to DB only');
      }
    } catch (error: any) {
      console.error('❌ Error creating/sending notification:', error);
      throw error;
    }
  },

  /**
   * Send notification when someone saves a pin
   */
  async notifyPinSaved(
    pinId: string,
    pinTitle: string,
    pinOwnerId: string,
    saverUsername: string
  ): Promise<void> {
    try {
      await this.createAndSendNotification({
        userId: pinOwnerId,
        type: NotificationTypeEnum.PIN_SAVED,
        title: '📌 Pin Saved!',
        body: `${saverUsername} saved your pin "${pinTitle}"`,
        data: {
          pinId,
          type: 'pin_saved',
          navigateTo: `/pins/${pinId}`,
        },
      });
    } catch (error: any) {
      console.error('❌ Error notifying pin saved:', error);
      // Don't throw error - notification failure shouldn't break the save operation
    }
  },

  /**
   * Send notification when someone likes a pin
   */
  async notifyPinLiked(
    pinId: string,
    pinTitle: string,
    pinOwnerId: string,
    likerUsername: string
  ): Promise<void> {
    try {
      await this.createAndSendNotification({
        userId: pinOwnerId,
        type: NotificationTypeEnum.PIN_LIKED,
        title: '❤️ Pin Liked!',
        body: `${likerUsername} liked your pin "${pinTitle}"`,
        data: {
          pinId,
          type: 'pin_liked',
          navigateTo: `/pins/${pinId}`,
        },
      });
    } catch (error: any) {
      console.error('❌ Error notifying pin liked:', error);
    }
  },

  /**
   * Register or update user's FCM token
   */
  async registerFCMToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await userModel.findByIdAndUpdate(userId, { fcm_token: fcmToken });
      console.log('✅ FCM token registered for user:', userId);
    } catch (error: any) {
      console.error('❌ Error registering FCM token:', error);
      throw error;
    }
  },

  /**
   * Remove user's FCM token (e.g., on logout)
   */
  async removeFCMToken(userId: string): Promise<void> {
    try {
      await userModel.findByIdAndUpdate(userId, { fcm_token: null });
      console.log('✅ FCM token removed for user:', userId);
    } catch (error: any) {
      console.error('❌ Error removing FCM token:', error);
      throw error;
    }
  },

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const notifications = await notificationModel
        .find({ user: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await notificationModel.countDocuments({ user: userId });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('❌ Error getting user notifications:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await notificationModel.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { is_read: true }
      );
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await notificationModel.updateMany(
        { user: userId, is_read: false },
        { is_read: true }
      );
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  },
};

