import { describe, it, expect, beforeAll } from '@jest/globals';

/**
 * Pin Like API Tests
 * 
 * These tests verify the pin like endpoints:
 * - POST /api/pinLike/togglePinLike
 * - GET /api/pinLike/getPinLikes
 * - GET /api/pinLike/checkPinLiked
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test data
let authToken: string;
let testPinId: string;

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

describe('Pin Like API Tests', () => {
    beforeAll(async () => {
        console.log('Setting up pin like tests...');
        
        // Login to get auth token
        const loginResponse = await makeRequest('/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'testpassword123'
        });

        if (loginResponse.status === 200) {
            authToken = loginResponse.data.sessionToken;
        } else {
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

    describe('POST /api/pinLike/togglePinLike', () => {
        it('should like a pin', async () => {
            const response = await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);

            console.log('Like response:', response);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('isLiked');
            expect(response.data).toHaveProperty('likesCount');
            expect(response.data.message).toBeDefined();
        });

        it('should unlike a pin', async () => {
            // Like first
            await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);

            // Then unlike
            const response = await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);

            console.log('Unlike response:', response);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data.message).toContain('unliked');
        });

        it('should fail without authentication', async () => {
            const response = await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            });

            console.log('No auth response:', response);

            expect(response.status).toBeGreaterThanOrEqual(401);
        });

        it('should fail with invalid pinId', async () => {
            const response = await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: 'invalid-pin-id-12345'
            }, authToken);

            console.log('Invalid pinId response:', response);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should fail with missing pinId', async () => {
            const response = await makeRequest('/pinLike/togglePinLike', 'POST', {}, authToken);

            console.log('Missing pinId response:', response);

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('GET /api/pinLike/getPinLikes', () => {
        beforeAll(async () => {
            // Ensure the pin has at least one like
            await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);
        });

        it('should get likes for a pin', async () => {
            const response = await makeRequest('/pinLike/getPinLikes', 'GET', {
                pinId: testPinId,
                page: '1',
                limit: '20'
            });

            console.log('Get likes response:', response);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('data');
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data).toHaveProperty('pagination');
        });

        it('should handle pagination', async () => {
            const response = await makeRequest('/pinLike/getPinLikes', 'GET', {
                pinId: testPinId,
                page: '1',
                limit: '5'
            });

            expect(response.status).toBe(200);
            expect(response.data.pagination).toHaveProperty('page', 1);
            expect(response.data.pagination).toHaveProperty('limit', 5);
        });

        it('should fail with missing pinId', async () => {
            const response = await makeRequest('/pinLike/getPinLikes', 'GET', {
                page: '1',
                limit: '20'
            });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('GET /api/pinLike/checkPinLiked', () => {
        it('should check if user liked a pin (authenticated)', async () => {
            // First like the pin
            await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);

            // Then check
            const response = await makeRequest('/pinLike/checkPinLiked', 'GET', {
                pinId: testPinId
            }, authToken);

            console.log('Check liked response:', response);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('isLiked');
            expect(response.data).toHaveProperty('likesCount');
        });

        it('should return false for unliked pin', async () => {
            // Ensure pin is not liked
            const toggleResponse = await makeRequest('/pinLike/togglePinLike', 'POST', {
                pinId: testPinId
            }, authToken);

            if (toggleResponse.data.isLiked) {
                // Unlike it
                await makeRequest('/pinLike/togglePinLike', 'POST', {
                    pinId: testPinId
                }, authToken);
            }

            // Check
            const response = await makeRequest('/pinLike/checkPinLiked', 'GET', {
                pinId: testPinId
            }, authToken);

            expect(response.status).toBe(200);
            expect(response.data.isLiked).toBe(false);
        });

        it('should work without authentication (return false)', async () => {
            const response = await makeRequest('/pinLike/checkPinLiked', 'GET', {
                pinId: testPinId
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('isLiked', false);
        });
    });
});

