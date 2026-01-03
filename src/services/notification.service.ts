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
  fromUserId?: string;
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
      // Ensure all data values are strings (FCM requirement)
      const stringData: Record<string, string> = {};
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          stringData[key] = String(value);
        }
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: stringData,
        token: fcmToken,
        android: {
          priority: 'high' as const,
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      const response = await messaging.send(message);
      console.log('✅ Successfully sent push notification:', response);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending push notification:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        fcmToken: fcmToken?.substring(0, 20) + '...',
      });
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
      console.log('📬 Creating notification:', {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        fromUserId: notificationData.fromUserId
      });

      // Get user's FCM token
      const user = await userModel.findById(notificationData.userId);
      if (!user) {
        console.warn('⚠️ User not found for notification:', notificationData.userId);
        return;
      }

      // Create notification record in database
      // Don't pass _id - let Mongoose auto-generate it
      const notificationDataToSave: any = {
        user: notificationData.userId,
        type: notificationData.type,
        content: notificationData.body,
        is_read: false,
        metadata: notificationData.data,
      };
      
      // Only add from_user if it exists
      if (notificationData.fromUserId || notificationData.data?.userId) {
        notificationDataToSave.from_user = notificationData.fromUserId || notificationData.data?.userId;
      }
      
      // Use create() which properly handles _id auto-generation
      const notification = await notificationModel.create(notificationDataToSave);

      console.log('✅ Notification created in DB:', {
        notificationId: notification._id,
        userId: notificationData.userId,
        type: notificationData.type
      });

      // Send push notification if user has FCM token
      if (user.fcm_token) {
        const sent = await this.sendPushNotification(
          user.fcm_token,
          notificationData.title,
          notificationData.body,
          notificationData.data
        );
        if (sent) {
          console.log('✅ Push notification sent successfully');
        }
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
    saverUsername: string,
    saverId: string
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
          userId: saverId,
        },
        fromUserId: saverId,
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
    likerUsername: string,
    likerId: string
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
          userId: likerId,
        },
        fromUserId: likerId,
      });
    } catch (error: any) {
      console.error('❌ Error notifying pin liked:', error);
    }
  },

  /**
   * Send notification when someone comments on a pin
   */
  async notifyPinCommented(
    pinId: string,
    pinTitle: string,
    pinOwnerId: string,
    commenterUsername: string,
    commenterId: string,
    commentId: string,
    isReply: boolean = false,
    parentCommentOwnerId?: string
  ): Promise<void> {
    try {
      // Notify pin owner if not commenting on own pin
      if (pinOwnerId !== commenterId) {
        await this.createAndSendNotification({
          userId: pinOwnerId,
          type: isReply ? NotificationTypeEnum.COMMENT_REPLIED : NotificationTypeEnum.PIN_COMMENTED,
          title: isReply ? '💬 Comment Reply!' : '💬 New Comment!',
          body: isReply 
            ? `${commenterUsername} replied to your comment`
            : `${commenterUsername} commented on your pin "${pinTitle}"`,
          data: {
            pinId,
            commentId,
            type: isReply ? 'comment_replied' : 'pin_commented',
            userId: commenterId,
            navigateTo: `/pins/${pinId}`,
          },
          fromUserId: commenterId,
        });
      }

      // If it's a reply, also notify the parent comment owner
      if (isReply && parentCommentOwnerId && parentCommentOwnerId !== commenterId) {
        await this.createAndSendNotification({
          userId: parentCommentOwnerId,
          type: NotificationTypeEnum.COMMENT_REPLIED,
          title: '💬 Comment Reply!',
          body: `${commenterUsername} replied to your comment`,
          data: {
            pinId,
            commentId,
            type: 'comment_replied',
            userId: commenterId,
            navigateTo: `/pins/${pinId}`,
          },
          fromUserId: commenterId,
        });
      }
    } catch (error: any) {
      console.error('❌ Error notifying pin commented:', error);
    }
  },

  /**
   * Send notification when someone follows a user
   */
  async notifyNewFollower(
    followedUserId: string,
    followerUsername: string,
    followerId: string
  ): Promise<void> {
    try {
      await this.createAndSendNotification({
        userId: followedUserId,
        type: NotificationTypeEnum.NEW_FOLLOWER,
        title: '👤 New Follower!',
        body: `${followerUsername} started following you`,
        data: {
          type: 'new_follower',
          userId: followerId,
          navigateTo: `/users/${followerId}`,
        },
        fromUserId: followerId,
      });
    } catch (error: any) {
      console.error('❌ Error notifying new follower:', error);
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
      console.log('🔍 Getting notifications for userId:', userId, 'type:', typeof userId);
      
      const skip = (page - 1) * limit;
      
      // Try to find notifications - handle both ObjectId and string formats
      const notifications = await notificationModel
        .find({ user: userId })
        .populate([
          { path: "from_user", select: "username profile_picture _id" }
        ])
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean() for better performance

      const total = await notificationModel.countDocuments({ user: userId });

      console.log('🔍 Found notifications:', notifications.length, 'out of', total, 'total');

      // Convert MongoDB _id to string for consistency
      const formattedNotifications = notifications.map((notif: any) => {
        // Handle both created_at and createdAt (from timestamps)
        const createdAt = notif.created_at || notif.createdAt || new Date();
        const createdDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
        
        return {
          ...notif,
          _id: notif._id.toString(),
          user: notif.user.toString(),
          from_user: notif.from_user ? {
            ...notif.from_user,
            _id: notif.from_user._id.toString()
          } : null,
          created_at: createdDate.toISOString()
        };
      });

      return {
        notifications: formattedNotifications,
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

