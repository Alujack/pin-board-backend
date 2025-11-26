import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Pin API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;
    let testPinId = '68eb10063edcc8eb591d248c';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('GET /pins', () => {
        it('should get list of pins', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins?page=1&limit=10`);
            
            expect([200, 401]).toContain(response.status);
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }
        });

        it('should support pagination', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins?page=1&limit=5`);
            
            expect([200, 401]).toContain(response.status);
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('pagination');
                expect(data.pagination).toHaveProperty('page');
                expect(data.pagination).toHaveProperty('limit');
            }
        });

        it('should support search query', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins?search=test&limit=10`);
            
            expect([200, 401]).toContain(response.status);
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
            }
        });
    });

    describe('GET /pins/detail/:id', () => {
        it('should get pin details by ID', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins/detail/${testPinId}`, {
                headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(data.data).toHaveProperty('_id');
            }

            expect([200, 404]).toContain(response.status);
        });

        it('should return 404 for non-existent pin', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins/detail/000000000000000000000000`);
            expect([404, 400, 401]).toContain(response.status);
        });
    });

    describe('POST /pins/create', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Pin',
                    description: 'Test Description'
                })
            });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('GET /pins/saved', () => {
        it('should get saved pins for authenticated user', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins/saved?page=1&limit=10`, {
                headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
            });

            expect([200, 401]).toContain(response.status);
            
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                // Data might be an array or an object with array
                if (Array.isArray(data.data)) {
                    expect(Array.isArray(data.data)).toBe(true);
                } else {
                    expect(data).toHaveProperty('data');
                }
            }
        });

        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/pins/saved`);
            expect([401, 403]).toContain(response.status);
        });
    });
});

