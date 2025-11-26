import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { followController } from '../../src/controllers/follow.controller.js';
import { followModel } from '../../src/models/follow.model.js';
import { userModel } from '../../src/models/user.model.js';
import { notificationModel } from '../../src/models/notification.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/follow.model.js');
jest.mock('../../src/models/user.model.js');
jest.mock('../../src/models/notification.model.js');

describe('Follow Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockFollow = {
        _id: 'follow123',
        follower: 'user123',
        following: 'user456',
        createdAt: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('toggleFollow', () => {
        it('should follow a user successfully', async () => {
            (userModel.findById as jest.Mock).mockResolvedValue({
                _id: 'user456',
                username: 'targetuser'
            });

            (followModel.findOne as jest.Mock).mockResolvedValue(null);
            (followModel.create as jest.Mock).mockResolvedValue(mockFollow);
            (notificationModel.create as jest.Mock).mockResolvedValue({});

            const result = await followController.toggleFollow('user456', mockContext);

            expect(result.success).toBe(true);
            expect(result.isFollowing).toBe(true);
            expect(result.message).toContain('followed');
            expect(followModel.create).toHaveBeenCalled();
            expect(notificationModel.create).toHaveBeenCalled();
        });

        it('should unfollow a user successfully', async () => {
            (userModel.findById as jest.Mock).mockResolvedValue({
                _id: 'user456',
                username: 'targetuser'
            });

            (followModel.findOne as jest.Mock).mockResolvedValue(mockFollow);
            (followModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

            const result = await followController.toggleFollow('user456', mockContext);

            expect(result.success).toBe(true);
            expect(result.isFollowing).toBe(false);
            expect(result.message).toContain('unfollowed');
            expect(followModel.deleteOne).toHaveBeenCalled();
        });

        it('should fail when trying to follow self', async () => {
            await expect(
                followController.toggleFollow('user123', mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when target user does not exist', async () => {
            (userModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                followController.toggleFollow('invalidUser', mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when user is not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            await expect(
                followController.toggleFollow('user456', noAuthContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('getFollowers', () => {
        it('should get followers list', async () => {
            const mockFollowers = [
                {
                    follower: {
                        _id: 'user1',
                        username: 'user1',
                        profile_picture: null
                    }
                },
                {
                    follower: {
                        _id: 'user2',
                        username: 'user2',
                        profile_picture: null
                    }
                }
            ];

            (followModel.countDocuments as jest.Mock).mockResolvedValue(2);
            (followModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockFollowers)
                        })
                    })
                })
            });

            const result = await followController.getFollowers('user456', 1, 20);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });
    });

    describe('getFollowing', () => {
        it('should get following list', async () => {
            const mockFollowing = [
                {
                    following: {
                        _id: 'user1',
                        username: 'user1',
                        profile_picture: null
                    }
                }
            ];

            (followModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (followModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockFollowing)
                        })
                    })
                })
            });

            const result = await followController.getFollowing('user456', 1, 20);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });

    describe('checkFollowing', () => {
        it('should return true when following', async () => {
            (followModel.findOne as jest.Mock).mockResolvedValue(mockFollow);

            const result = await followController.checkFollowing('user456', mockContext);

            expect(result.success).toBe(true);
            expect(result.isFollowing).toBe(true);
        });

        it('should return false when not following', async () => {
            (followModel.findOne as jest.Mock).mockResolvedValue(null);

            const result = await followController.checkFollowing('user456', mockContext);

            expect(result.success).toBe(true);
            expect(result.isFollowing).toBe(false);
        });

        it('should return false when not authenticated', async () => {
            const noAuthContext = { user: { _id: null } };

            const result = await followController.checkFollowing('user456', noAuthContext);

            expect(result.success).toBe(true);
            expect(result.isFollowing).toBe(false);
        });
    });
});

