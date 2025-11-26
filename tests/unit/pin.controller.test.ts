import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { pinController } from '../../src/controllers/pin.controller.js';
import { pinModel } from '../../src/models/pin.model.js';
import { boardModel } from '../../src/models/board.model.js';
import { ORPCError } from '@orpc/client';

// Mock the models
jest.mock('../../src/models/pin.model.js');
jest.mock('../../src/models/board.model.js');

describe('Pin Controller Unit Tests', () => {
    const mockContext = {
        user: {
            _id: 'user123',
            username: 'testuser'
        }
    };

    const mockPin = {
        _id: 'pin123',
        title: 'Test Pin',
        description: 'Test Description',
        user: 'user123',
        board: 'board123',
        imageUrl: 'https://example.com/image.jpg',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn(() => ({
            _id: 'pin123',
            title: 'Test Pin',
            user: 'user123'
        }))
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPins', () => {
        it('should get pins with pagination', async () => {
            const query = {
                page: 1,
                limit: 20,
                search: ''
            };

            (pinModel.countDocuments as jest.Mock).mockResolvedValue(50);
            (pinModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockPin])
                        })
                    })
                })
            });

            const result = await pinController.getPins(query, mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('should filter pins by search query', async () => {
            const query = {
                page: 1,
                limit: 20,
                search: 'test'
            };

            (pinModel.countDocuments as jest.Mock).mockResolvedValue(5);
            (pinModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockPin])
                        })
                    })
                })
            });

            const result = await pinController.getPins(query, mockContext);

            expect(result.success).toBe(true);
            expect(pinModel.find).toHaveBeenCalled();
        });
    });

    describe('getPinById', () => {
        it('should get a pin by ID', async () => {
            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockPin)
            });

            const result = await pinController.getPinById('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data._id).toBe('pin123');
        });

        it('should fail when pin does not exist', async () => {
            (pinModel.findById as jest.Mock).mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await expect(
                pinController.getPinById('invalidPin', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('getCreatedPins', () => {
        it('should get pins created by user', async () => {
            const query = { page: 1, limit: 20 };

            (pinModel.countDocuments as jest.Mock).mockResolvedValue(10);
            (pinModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue([mockPin])
                        })
                    })
                })
            });

            const result = await pinController.getCreatedPins(query, mockContext);

            expect(result.success).toBe(true);
            expect(pinModel.find).toHaveBeenCalledWith(
                expect.objectContaining({ user: 'user123' })
            );
        });

        it('should fail when user is not authenticated', async () => {
            const query = { page: 1, limit: 20 };
            const noAuthContext = { user: { _id: null } };

            await expect(
                pinController.getCreatedPins(query, noAuthContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('getCreatedPinsImageMedia', () => {
        it('should get only image media from created pins', async () => {
            const mockPinWithMedia = {
                ...mockPin,
                media: [
                    { type: 'image', url: 'image1.jpg' },
                    { type: 'video', url: 'video1.mp4' },
                    { type: 'image', url: 'image2.jpg' }
                ]
            };

            (pinModel.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue([mockPinWithMedia])
                })
            });

            const result = await pinController.getCreatedPinsImageMedia(mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });

    describe('updatePin', () => {
        it('should update a pin successfully', async () => {
            const updateData = {
                title: 'Updated Title',
                description: 'Updated Description'
            };

            const updatedPin = {
                ...mockPin,
                ...updateData,
                save: jest.fn().mockResolvedValue(true)
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(updatedPin);

            const result = await pinController.updatePin('pin123', updateData, mockContext);

            expect(result.success).toBe(true);
            expect(updatedPin.save).toHaveBeenCalled();
        });

        it('should fail when user tries to update another user\'s pin', async () => {
            const updateData = { title: 'Updated' };
            const otherUserPin = {
                ...mockPin,
                user: { toString: () => 'otherUser456' }
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(otherUserPin);

            await expect(
                pinController.updatePin('pin123', updateData, mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('deletePin', () => {
        it('should delete a pin successfully', async () => {
            const pinToDelete = {
                ...mockPin,
                user: { toString: () => 'user123' }
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(pinToDelete);
            (pinModel.findByIdAndDelete as jest.Mock).mockResolvedValue(pinToDelete);

            const result = await pinController.deletePin('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(pinModel.findByIdAndDelete).toHaveBeenCalledWith('pin123');
        });

        it('should fail when user tries to delete another user\'s pin', async () => {
            const otherUserPin = {
                ...mockPin,
                user: { toString: () => 'otherUser456' }
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(otherUserPin);

            await expect(
                pinController.deletePin('pin123', mockContext)
            ).rejects.toThrow(ORPCError);
        });
    });

    describe('savePinToUser', () => {
        it('should save a pin to user\'s saved pins', async () => {
            const mockUser = {
                _id: 'user123',
                saved_pins: [],
                save: jest.fn().mockResolvedValue(true)
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(mockPin);
            // Mock user model
            jest.spyOn(pinController as any, 'getUserById').mockResolvedValue(mockUser);

            const result = await pinController.savePinToUser('pin123', 'user123');

            expect(result.success).toBe(true);
            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    describe('unsavePinFromUser', () => {
        it('should remove a pin from user\'s saved pins', async () => {
            const mockUser = {
                _id: 'user123',
                saved_pins: ['pin123'],
                save: jest.fn().mockResolvedValue(true)
            };

            (pinModel.findById as jest.Mock).mockResolvedValue(mockPin);
            jest.spyOn(pinController as any, 'getUserById').mockResolvedValue(mockUser);

            const result = await pinController.unsavePinFromUser('pin123', mockContext);

            expect(result.success).toBe(true);
            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    describe('getSavedPinsMedia', () => {
        it('should get media from saved pins', async () => {
            const mockUser = {
                _id: 'user123',
                saved_pins: ['pin123', 'pin456']
            };

            const mockPins = [
                { ...mockPin, _id: 'pin123' },
                { ...mockPin, _id: 'pin456' }
            ];

            jest.spyOn(pinController as any, 'getUserById').mockResolvedValue(mockUser);
            (pinModel.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockPins)
                })
            });

            const result = await pinController.getSavedPinsMedia(mockContext);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });
});

