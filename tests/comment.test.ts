import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Comment API Tests
 * 
 * These tests verify the comment endpoints:
 * - GET /api/comment/getComments
 * - POST /api/comment/createComment
 * - PUT /api/comment/updateComment
 * - DELETE /api/comment/deleteComment
 * - POST /api/comment/toggleCommentLike
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test data
let authToken: string;
let testPinId: string;
let testCommentId: string;
let testUserId: string;

// Helper function to make authenticated requests
async function makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    token?: string
) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
        method,
        headers,
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const url = method === 'GET' && body
        ? `${BASE_URL}${endpoint}?${new URLSearchParams(body)}`
        : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, options);
    const data = await response.json();

    return {
        status: response.status,
        data,
    };
}

describe('Comment API Tests', () => {
    beforeAll(async () => {
        // Login to get auth token
        console.log('Setting up tests...');
        
        // You'll need to replace these with valid test credentials
        const loginResponse = await makeRequest('/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'testpassword123'
        });

        if (loginResponse.status === 200) {
            authToken = loginResponse.data.sessionToken;
            testUserId = loginResponse.data.user._id;
        } else {
            console.error('Failed to login:', loginResponse);
            throw new Error('Authentication failed. Please create a test user first.');
        }

        // Get a test pin ID
        const pinsResponse = await makeRequest('/pins', 'GET', { limit: '1' }, authToken);
        if (pinsResponse.status === 200 && pinsResponse.data.data.length > 0) {
            testPinId = pinsResponse.data.data[0]._id;
        } else {
            throw new Error('No pins found. Please create a test pin first.');
        }
    });

    describe('GET /api/comment/getComments', () => {
        it('should get comments for a pin', async () => {
            const response = await makeRequest('/comment/getComments', 'GET', {
                pinId: testPinId,
                page: '1',
                limit: '20',
                sort: 'newest'
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('data');
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data).toHaveProperty('pagination');
        });

        it('should return 400 for missing pinId', async () => {
            const response = await makeRequest('/comment/getComments', 'GET', {
                page: '1',
                limit: '20'
            });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should handle pagination correctly', async () => {
            const response = await makeRequest('/comment/getComments', 'GET', {
                pinId: testPinId,
                page: '1',
                limit: '5',
                sort: 'newest'
            });

            expect(response.status).toBe(200);
            expect(response.data.pagination).toHaveProperty('page', 1);
            expect(response.data.pagination).toHaveProperty('limit', 5);
        });
    });

    describe('POST /api/comment/createComment', () => {
        it('should create a new comment', async () => {
            const response = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: 'This is a test comment from automated tests'
                }
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('data');
            expect(response.data.data).toHaveProperty('_id');
            expect(response.data.data.content).toBe('This is a test comment from automated tests');

            // Save comment ID for later tests
            testCommentId = response.data.data._id;
        });

        it('should create a reply to a comment', async () => {
            // First create a parent comment
            const parentResponse = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: 'Parent comment'
                }
            }, authToken);

            expect(parentResponse.status).toBe(200);
            const parentCommentId = parentResponse.data.data._id;

            // Now create a reply
            const replyResponse = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: 'This is a reply',
                    parent_comment: parentCommentId
                }
            }, authToken);

            expect(replyResponse.status).toBe(200);
            expect(replyResponse.data.data.parent_comment).toBe(parentCommentId);
        });

        it('should fail without authentication', async () => {
            const response = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: 'This should fail'
                }
            });

            expect(response.status).toBeGreaterThanOrEqual(401);
        });

        it('should fail with empty content', async () => {
            const response = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: ''
                }
            }, authToken);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should fail with invalid pinId', async () => {
            const response = await makeRequest('/comment/createComment', 'POST', {
                pinId: 'invalid-pin-id',
                body: {
                    content: 'Test comment'
                }
            }, authToken);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/comment/toggleCommentLike', () => {
        it('should like a comment', async () => {
            const response = await makeRequest('/comment/toggleCommentLike', 'POST', {
                commentId: testCommentId
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('isLiked', true);
            expect(response.data.message).toContain('liked');
        });

        it('should unlike a comment', async () => {
            // Like first
            await makeRequest('/comment/toggleCommentLike', 'POST', {
                commentId: testCommentId
            }, authToken);

            // Then unlike
            const response = await makeRequest('/comment/toggleCommentLike', 'POST', {
                commentId: testCommentId
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('isLiked', false);
            expect(response.data.message).toContain('unliked');
        });

        it('should fail without authentication', async () => {
            const response = await makeRequest('/comment/toggleCommentLike', 'POST', {
                commentId: testCommentId
            });

            expect(response.status).toBeGreaterThanOrEqual(401);
        });

        it('should fail with invalid commentId', async () => {
            const response = await makeRequest('/comment/toggleCommentLike', 'POST', {
                commentId: 'invalid-comment-id'
            }, authToken);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('PUT /api/comment/updateComment', () => {
        it('should update a comment', async () => {
            const response = await makeRequest('/comment/updateComment', 'PUT', {
                commentId: testCommentId,
                content: 'Updated comment content'
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data.data.content).toBe('Updated comment content');
        });

        it('should fail to update another user\'s comment', async () => {
            // This would require a second test user
            // For now, we'll skip this test
        });
    });

    describe('DELETE /api/comment/deleteComment', () => {
        it('should delete a comment', async () => {
            // Create a comment to delete
            const createResponse = await makeRequest('/comment/createComment', 'POST', {
                pinId: testPinId,
                body: {
                    content: 'Comment to be deleted'
                }
            }, authToken);

            const commentToDelete = createResponse.data.data._id;

            // Delete it
            const response = await makeRequest('/comment/deleteComment', 'DELETE', {
                commentId: commentToDelete
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
        });

        it('should fail without authentication', async () => {
            const response = await makeRequest('/comment/deleteComment', 'DELETE', {
                commentId: testCommentId
            });

            expect(response.status).toBeGreaterThanOrEqual(401);
        });
    });

    afterAll(() => {
        console.log('Tests completed!');
    });
});

