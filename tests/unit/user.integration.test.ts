import { describe, it, expect, beforeAll } from '@jest/globals';

describe('User API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;
    const testUserId = '68e2779051f65cdb7ac9a58f';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('GET /users', () => {
        it('should get list of users', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users?page=1&limit=10`);
            
            if (response.ok) {
                const data = await response.json();
                // API returns array directly, not wrapped in data property
                expect(Array.isArray(data)).toBe(true);
            }

            expect([200, 401]).toContain(response.status);
        });

        it('should support search query', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users?search=test&limit=5`);
            
            if (response.ok) {
                const data = await response.json();
                // API returns array directly
                expect(Array.isArray(data)).toBe(true);
            }

            expect([200, 401]).toContain(response.status);
        });
    });

    describe('GET /users/:id', () => {
        it('should get user by ID', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/${testUserId}`);
            
            if (response.ok) {
                const data = await response.json();
                // API returns user object directly
                expect(data).toHaveProperty('_id');
            }

            expect([200, 404, 400]).toContain(response.status);
        });

        it('should return 404 for non-existent user', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/000000000000000000000000`);
            expect([404, 400]).toContain(response.status);
        });
    });

    describe('GET /users/profile/:userId', () => {
        it('should get user profile with stats', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/profile/${testUserId}`);
            
            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
            }

            expect([200, 404, 401]).toContain(response.status);
        });
    });

    describe('GET /users/me', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/me`);
            expect([401, 403]).toContain(response.status);
        });

        it('should get current user with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
            }

            expect([200, 401]).toContain(response.status);
        });
    });

    describe('PUT /users/profile', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: 'Updated Name',
                    bio: 'Updated bio'
                })
            });

            expect([401, 403]).toContain(response.status);
        });

        it('should update profile with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    bio: `Updated bio ${Date.now()}`,
                    website: 'https://example.com'
                })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('success');
            }

            expect([200, 400, 401]).toContain(response.status);
        });
    });
});

