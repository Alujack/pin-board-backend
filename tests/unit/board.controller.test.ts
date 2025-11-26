import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { boardController } from '../../src/controllers/board.controller.js';
import { boardModel } from '../../src/models/board.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/board.model.js');

describe('Board Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockBoard = {
        _id: 'board123',
        name: 'Test Board',
        description: 'Test Description',
        user: 'user123',
        is_private: false,
        pins: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn(() => ({
            _id: 'board123',
            name: 'Test Board',
            user: 'user123'
        })),
        save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createBoard', () => {
        it('should create a board successfully', async () => {
            const boardData = {
                name: 'New Board',
                description: 'New Description',
                is_private: false
            };

            (boardModel as any).mockImplementation(() => ({
                ...mockBoard,
                ...boardData,
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    ...mockBoard,
                    ...boardData
                })
            }));

            const result = await boardController.createBoard(boardData, mockContext);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Board created successfully');
            expect(result.data).toBeDefined();
        });

        it('should fail when user is not authenticated', async () => {
            const boardData = { name: 'Test', description: '' };
            const noAuthContext = { user: { _id: null } };

            await expect(
                boardController.createBoard(boardData, noAuthContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when name is missing', async () => {
            const boardData = { name: '', description: 'Test' };

            await expect(
                boardController.createBoard(boardData, mockContext)
            ).rejects.toThrow();
        });
    });

    describe('getBoards', () => {
        it('should get boards with pagination', async () => {
            const query = {
                page: 1,
                limit: 20,
                search: ''
            };

            (boardModel.countDocuments as jest.Mock).mockResolvedValue(10);
            (boardModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockBoard])
                        })
                    })
                })
            });

            const result = await boardController.getBoards(query, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should filter boards by search query', async () => {
            const query = {
                page: 1,
                limit: 20,
                search: 'test'
            };

            (boardModel.countDocuments as jest.Mock).mockResolvedValue(5);
            (boardModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockBoard])
                        })
                    })
                })
            });

            const result = await boardController.getBoards(query, mockContext);

            expect(result.success).toBe(true);
        });
    });

    describe('getBoardById', () => {
        it('should get a board by ID', async () => {
            (boardModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBoard)
            });

            const result = await boardController.getBoardById('board123', mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data._id).toBe('board123');
        });

        it('should fail when board does not exist', async () => {
            (boardModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(
                boardController.getBoardById('invalidBoard', mockContext)
            ).rejects.toThrow(ORPCError);
        });

        it('should fail when accessing private board of another user', async () => {
            const privateBoard = {
                ...mockBoard,
                is_private: true,
                user: { _id: 'otherUser456' }
            };

            (boardModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(privateBoard)
            });

            await expect(
                boardController.getBoardById('board123', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('updateBoard', () => {
        it('should update a board successfully', async () => {
            const updateData = {
                name: 'Updated Board',
                description: 'Updated Description'
            };

            const boardToUpdate = {
                ...mockBoard,
                user: { toString: () => 'user123' },
                save: jest.fn().mockResolvedValue(true)
            };

            (boardModel.findById as jest.Mock).mockResolvedValue(boardToUpdate);

            const result = await boardController.updateBoard('board123', updateData, mockContext);

            expect(result.success).toBe(true);
            expect(boardToUpdate.save).toHaveBeenCalled();
        });

        it('should fail when user tries to update another user\'s board', async () => {
            const updateData = { name: 'Updated' };
            const otherUserBoard = {
                ...mockBoard,
                user: { toString: () => 'otherUser456' }
            };

            (boardModel.findById as jest.Mock).mockResolvedValue(otherUserBoard);

            await expect(
                boardController.updateBoard('board123', updateData, mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('deleteBoard', () => {
        it('should delete a board successfully', async () => {
            const boardToDelete = {
                ...mockBoard,
                user: { toString: () => 'user123' }
            };

            (boardModel.findById as jest.Mock).mockResolvedValue(boardToDelete);
            (boardModel.findByIdAndDelete as jest.Mock).mockResolvedValue(boardToDelete);

            const result = await boardController.deleteBoard('board123', mockContext);

            expect(result.success).toBe(true);
            expect(boardModel.findByIdAndDelete).toHaveBeenCalledWith('board123');
        });

        it('should fail when user tries to delete another user\'s board', async () => {
            const otherUserBoard = {
                ...mockBoard,
                user: { toString: () => 'otherUser456' }
            };

            (boardModel.findById as jest.Mock).mockResolvedValue(otherUserBoard);

            await expect(
                boardController.deleteBoard('board123', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('getUserBoards', () => {
        it('should get boards for a specific user', async () => {
            (boardModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([mockBoard])
                })
            });

            const result = await boardController.getUserBoards('user123', mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should only return public boards for other users', async () => {
            const publicBoard = { ...mockBoard, is_private: false };
            const privateBoard = { ...mockBoard, _id: 'board456', is_private: true };

            (boardModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([publicBoard])
                })
            });

            const result = await boardController.getUserBoards('otherUser456', mockContext);

            expect(result.success).toBe(true);
            expect(boardModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: 'otherUser456',
                    is_private: false
                })
            );
        });
    });
});

