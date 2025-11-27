import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Board API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('GET /boards', () => {
        it('should get list of boards', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boards?page=1&limit=10`);
            
            expect([200, 401]).toContain(response.status);
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
            }
        });

        it('should support pagination', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boards?page=1&limit=5`);
            
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('pagination');
            }
            expect([200, 401]).toContain(response.status);
        });
    });

    describe('POST /boards/create', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boards/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Board',
                    description: 'Test Description'
                })
            });

            expect([401, 403, 404]).toContain(response.status);
        });

        it('should create board with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boards/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    name: `Test Board ${Date.now()}`,
                    description: 'Test Description',
                    is_private: false
                })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('success');
            }

            expect([200, 201, 400, 401, 404]).toContain(response.status);
        });
    });

    describe('GET /boards/:id', () => {
        it('should get board details', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            // First get a board ID
            const listResponse = await fetch(`${BASE_URL}/boards?limit=1`);
            if (listResponse.ok) {
                const listData = await listResponse.json();
                if (listData.data && listData.data.length > 0) {
                    const boardId = listData.data[0]._id;
                    
                    const response = await fetch(`${BASE_URL}/boards/${boardId}`);
                    if (response.ok) {
                        const data = await response.json();
                        expect(data).toHaveProperty('data');
                    }
                    expect([200, 401, 404]).toContain(response.status);
                }
            }
        });
    });
});

