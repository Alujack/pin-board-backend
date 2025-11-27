import { describe, it, expect, beforeAll } from '@jest/globals';

describe('API Integration Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    const TEST_PIN_ID = '68eb10063edcc8eb591d248c';

    let serverAvailable = false;

    beforeAll(async () => {
        // Check if server is running
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`
                }
            });
            serverAvailable = response.ok;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('Pin Like Endpoints', () => {
        it('should toggle pin like successfully', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping integration test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pinLike/togglePinLike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({ pinId: TEST_PIN_ID })
            });

            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('isLiked');
            expect(data).toHaveProperty('likesCount');
        });
    });

    describe('Comment Endpoints', () => {
        it('should create a comment successfully', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping integration test');
                return;
            }

            const response = await fetch(`${BASE_URL}/comment/createComment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    pinId: TEST_PIN_ID,
                    body: {
                        content: 'Test comment from integration test'
                    }
                })
            });

            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('data');
        });

        it('should get comments for a pin', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping integration test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/comment/getComments?pinId=${TEST_PIN_ID}&page=1&limit=20&sort=newest`,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`
                    }
                }
            );

            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('data');
            expect(Array.isArray(data.data)).toBe(true);
        });
    });

    describe('Authentication Tests', () => {
        it('should return 401 for protected endpoints without token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping integration test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pinLike/togglePinLike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pinId: TEST_PIN_ID })
            });

            // Should be unauthorized
            expect([401, 403]).toContain(response.status);
        });
    });
});

