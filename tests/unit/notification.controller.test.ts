import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { notificationController } from '../../src/controllers/notification.controller.js';
import { notificationModel } from '../../src/models/notification.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/notification.model.js');

describe('Notification Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockNotification = {
        _id: 'notif123',
        user: 'user123',
        from_user: 'user456',
        type: 'PIN_LIKED',
        content: 'User456 liked your pin',
        is_read: false,
        metadata: {
            pin_id: 'pin123'
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNotifications', () => {
        it('should get notifications with pagination', async () => {
            (notificationModel.countDocuments as jest.Mock).mockResolvedValue(15);
            (notificationModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockNotification])
                        })
                    })
                })
            });

            const result = await notificationController.getNotifications(mockContext, 1, 20);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.pagination).toBeDefined();
        });

        it('should fail when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            await expect(
                notificationController.getNotifications(noAuthContext, 1, 20)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const notifToMark = {
                ...mockNotification,
                user: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true)
            };

            (notificationModel.findById as jest.Mock).mockResolvedValue(notifToMark);

            const result = await notificationController.markAsRead('notif123', mockContext);

            expect(result.success).toBe(true);
            expect(notifToMark.is_read).toBe(true);
            expect(notifToMark.save).toHaveBeenCalled();
        });

        it('should fail when notification does not exist', async () => {
            (notificationModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                notificationController.markAsRead('invalidNotif', mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when user tries to mark another user\'s notification', async () => {
            const otherUserNotif = {
                ...mockNotification,
                user: { toString: () => 'otherUser456' }
            };

            (notificationModel.findById as jest.Mock).mockResolvedValue(otherUserNotif);

            await expect(
                notificationController.markAsRead('notif123', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            (notificationModel.updateMany as jest.Mock).mockResolvedValue({
                modifiedCount: 5
            });

            const result = await notificationController.markAllAsRead(mockContext);

            expect(result.success).toBe(true);
            expect(notificationModel.updateMany).toHaveBeenCalledWith(
                { user: 'user123', is_read: false },
                { $set: { is_read: true } }
            );
        });

        it('should fail when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            await expect(
                notificationController.markAllAsRead(noAuthContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('registerFCMToken', () => {
        it('should register FCM token successfully', async () => {
            const mockUser = {
                _id: 'user123',
                fcm_token: null,
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(notificationController as any, 'getUserById').mockResolvedValue(mockUser);

            const result = await notificationController.registerFCMToken('fcm_token_123', mockContext);

            expect(result.success).toBe(true);
            expect(mockUser.fcm_token).toBe('fcm_token_123');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should fail when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            await expect(
                notificationController.registerFCMToken('token', noAuthContext)
            ).rejects.toThrow(ORPCError);
        });
    });
});

