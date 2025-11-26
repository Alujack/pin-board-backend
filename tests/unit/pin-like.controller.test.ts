import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { pinLikeController } from '../../src/controllers/pin-like.controller.js';
import { pinLikeModel } from '../../src/models/pin-like.model.js';
import { pinModel } from '../../src/models/pin.model.js';
import { notificationModel } from '../../src/models/notification.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/pin-like.model.js');
jest.mock('../../src/models/pin.model.js');
jest.mock('../../src/models/notification.model.js');

describe('Pin Like Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockPin = {
        _id: 'pin123',
        user: { _id: 'user456' },
        title: 'Test Pin'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('togglePinLike', () => {
        it('should like a pin successfully', async () => {
            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPin)
            });

            (pinLikeModel.findOne as jest.Mock).mockResolvedValue(null);
            (pinLikeModel.create as jest.Mock).mockResolvedValue({
                _id: 'like123',
                pin: 'pin123',
                user: 'user123'
            });
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (notificationModel.create as jest.Mock).mockResolvedValue({});

            const result = await pinLikeController.togglePinLike('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(true);
            expect(result.likesCount).toBe(1);
            expect(result.message).toBe('Pin liked');
            expect(pinLikeModel.create).toHaveBeenCalled();
            expect(notificationModel.create).toHaveBeenCalled();
        });

        it('should unlike a pin successfully', async () => {
            const existingLike = {
                _id: 'like123',
                pin: 'pin123',
                user: 'user123'
            };

            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPin)
            });

            (pinLikeModel.findOne as jest.Mock).mockResolvedValue(existingLike);
            (pinLikeModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(0);

            const result = await pinLikeController.togglePinLike('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(false);
            expect(result.likesCount).toBe(0);
            expect(result.message).toBe('Pin unliked');
            expect(pinLikeModel.deleteOne).toHaveBeenCalled();
        });

        it('should fail when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            await expect(
                pinLikeController.togglePinLike('pin123', noAuthContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when pin does not exist', async () => {
            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(
                pinLikeController.togglePinLike('invalidPin', mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should not create notification when liking own pin', async () => {
            const ownPin = {
                _id: 'pin123',
                user: { _id: 'user123' }, // Same as mockContext.user._id
                title: 'My Pin'
            };

            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(ownPin)
            });

            (pinLikeModel.findOne as jest.Mock).mockResolvedValue(null);
            (pinLikeModel.create as jest.Mock).mockResolvedValue({});
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(1);

            await pinLikeController.togglePinLike('pin123', mockContext);

            expect(notificationModel.create).not.toHaveBeenCalled();
        });
    });

    describe('getPinLikes', () => {
        it('should get likes for a pin with pagination', async () => {
            const mockLikes = [
                {
                    _id: 'like1',
                    user: { _id: 'user1', username: 'user1', profile_picture: null },
                    createdAt: new Date()
                },
                {
                    _id: 'like2',
                    user: { _id: 'user2', username: 'user2', profile_picture: null },
                    createdAt: new Date()
                }
            ];

            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(10);
            (pinLikeModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockLikes)
                        })
                    })
                })
            });

            const result = await pinLikeController.getPinLikes('pin123', 1, 20);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockLikes);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(20);
            expect(result.pagination.total).toBe(10);
            expect(result.pagination.totalPages).toBe(1);
        });

        it('should handle empty likes list', async () => {
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (pinLikeModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([])
                        })
                    })
                })
            });

            const result = await pinLikeController.getPinLikes('pin123', 1, 20);

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('should calculate pagination correctly', async () => {
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(45);
            (pinLikeModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([])
                        })
                    })
                })
            });

            const result = await pinLikeController.getPinLikes('pin123', 2, 20);

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.totalPages).toBe(3); // 45 / 20 = 2.25, ceil = 3
        });
    });

    describe('checkPinLiked', () => {
        it('should return true when user liked the pin', async () => {
            const mockLike = {
                _id: 'like123',
                pin: 'pin123',
                user: 'user123'
            };

            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(5);
            (pinLikeModel.findOne as jest.Mock).mockResolvedValue(mockLike);

            const result = await pinLikeController.checkPinLiked('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(true);
            expect(result.likesCount).toBe(5);
        });

        it('should return false when user has not liked the pin', async () => {
            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(3);
            (pinLikeModel.findOne as jest.Mock).mockResolvedValue(null);

            const result = await pinLikeController.checkPinLiked('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(false);
            expect(result.likesCount).toBe(3);
        });

        it('should return false when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            (pinLikeModel.countDocuments as jest.Mock).mockResolvedValue(2);

            const result = await pinLikeController.checkPinLiked('pin123', noAuthContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(false);
            expect(result.likesCount).toBe(2);
        });
    });
});

