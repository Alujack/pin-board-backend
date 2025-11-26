import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { commentController } from '../../src/controllers/comment.controller.js';
import { commentModel } from '../../src/models/comment.model.js';
import { pinModel } from '../../src/models/pin.model.js';
import { notificationModel } from '../../src/models/notification.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/comment.model.js');
jest.mock('../../src/models/pin.model.js');
jest.mock('../../src/models/notification.model.js');

describe('Comment Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockPin = {
        _id: 'pin123',
        user: 'user456',
        title: 'Test Pin'
    };

    const mockComment = {
        _id: 'comment123',
        pin: 'pin123',
        user: 'user123',
        content: 'Test comment',
        likes: [],
        is_deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn(() => ({
            _id: 'comment123',
            pin: 'pin123',
            user: 'user123',
            content: 'Test comment',
            likes: [],
            is_deleted: false
        })),
        save: jest.fn(),
        populate: jest.fn().mockResolvedValue({
            _id: 'comment123',
            user: { _id: 'user123', username: 'testuser' }
        })
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createComment', () => {
        it('should create a comment successfully', async () => {
            const commentData = {
                content: 'This is a test comment',
                parent_comment: undefined
            };

            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPin)
            });

            (commentModel as any).mockImplementation(() => mockComment);
            (notificationModel.create as jest.Mock).mockResolvedValue({});

            const result = await commentController.createComment('pin123', commentData, mockContext);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Comment created successfully');
            expect(result.data).toBeDefined();
        });

        it('should fail when user is not authenticated', async () => {
            const commentData = { content: 'Test' };
            const noAuthContext = { user: null };

            await expect(
                commentController.createComment('pin123', commentData, noAuthContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when pin does not exist', async () => {
            const commentData = { content: 'Test' };

            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(
                commentController.createComment('invalidPin', commentData, mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should create a reply to a comment', async () => {
            const commentData = {
                content: 'This is a reply',
                parent_comment: 'parentComment123'
            };

            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPin)
            });

            (commentModel.findById as jest.Mock).mockResolvedValue({
                _id: 'parentComment123',
                user: 'user456'
            });

            (commentModel as any).mockImplementation(() => mockComment);
            (notificationModel.create as jest.Mock).mockResolvedValue({});

            const result = await commentController.createComment('pin123', commentData, mockContext);

            expect(result.success).toBe(true);
            expect(notificationModel.create).toHaveBeenCalled();
        });
    });

    describe('getComments', () => {
        it('should get comments for a pin', async () => {
            const query = {
                page: '1',
                limit: '20',
                sort: 'newest'
            };

            (commentModel.countDocuments as jest.Mock).mockResolvedValue(5);
            (commentModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockComment])
                        })
                    })
                })
            });

            const result = await commentController.getComments('pin123', query, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.pagination).toBeDefined();
        });

        it('should handle pagination correctly', async () => {
            const query = {
                page: '2',
                limit: '10',
                sort: 'newest'
            };

            (commentModel.countDocuments as jest.Mock).mockResolvedValue(25);
            (commentModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([])
                        })
                    })
                })
            });

            const result = await commentController.getComments('pin123', query, mockContext);

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(10);
            expect(result.pagination.totalPages).toBe(3);
        });
    });

    describe('toggleCommentLike', () => {
        it('should like a comment', async () => {
            const commentToLike = {
                ...mockComment,
                likes: [],
                user: { _id: 'user456' },
                save: jest.fn().mockResolvedValue(true)
            };

            (commentModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(commentToLike)
            });

            (notificationModel.create as jest.Mock).mockResolvedValue({});

            const result = await commentController.toggleCommentLike('comment123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(true);
            expect(result.message).toContain('liked');
        });

        it('should unlike a comment', async () => {
            const commentToUnlike = {
                ...mockComment,
                likes: [{ toString: () => 'user123' }],
                save: jest.fn().mockResolvedValue(true)
            };

            (commentModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(commentToUnlike)
            });

            const result = await commentController.toggleCommentLike('comment123', mockContext);

            expect(result.success).toBe(true);
            expect(result.isLiked).toBe(false);
            expect(result.message).toContain('unliked');
        });

        it('should fail when comment does not exist', async () => {
            (commentModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(
                commentController.toggleCommentLike('invalidComment', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('updateComment', () => {
        it('should update a comment successfully', async () => {
            const updateData = { content: 'Updated content' };
            const commentToUpdate = {
                ...mockComment,
                user: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    ...mockComment,
                    content: 'Updated content'
                })
            };

            (commentModel.findById as jest.Mock).mockResolvedValue(commentToUpdate);
            (commentModel.countDocuments as jest.Mock).mockResolvedValue(0);

            const result = await commentController.updateComment('comment123', updateData, mockContext);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Comment updated successfully');
        });

        it('should fail when user tries to update another user\'s comment', async () => {
            const updateData = { content: 'Updated content' };
            const otherUserComment = {
                ...mockComment,
                user: { toString: () => 'otherUser456' }
            };

            (commentModel.findById as jest.Mock).mockResolvedValue(otherUserComment);

            await expect(
                commentController.updateComment('comment123', updateData, mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('deleteComment', () => {
        it('should delete a comment successfully', async () => {
            const commentToDelete = {
                ...mockComment,
                user: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true)
            };

            (commentModel.findById as jest.Mock).mockResolvedValue(commentToDelete);

            const result = await commentController.deleteComment('comment123', mockContext);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Comment deleted successfully');
            expect(commentToDelete.is_deleted).toBe(true);
            expect(commentToDelete.content).toBe('[deleted]');
        });

        it('should fail when user tries to delete another user\'s comment', async () => {
            const otherUserComment = {
                ...mockComment,
                user: { toString: () => 'otherUser456' }
            };

            (commentModel.findById as jest.Mock).mockResolvedValue(otherUserComment);

            await expect(
                commentController.deleteComment('comment123', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });
});

