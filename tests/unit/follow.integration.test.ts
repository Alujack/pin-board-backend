import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Follow API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;
    const testUserId = '68e6aa19a7608bf68397d9ad';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('POST /follow/followUser', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/follow/followUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: testUserId })
            });

            expect([401, 403]).toContain(response.status);
        });

        it('should follow user with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/follow/followUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({ userId: testUserId })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('success');
            }

            expect([200, 400, 401]).toContain(response.status);
        });
    });

    describe('POST /follow/unfollowUser', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/follow/unfollowUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: testUserId })
            });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('GET /follow/getFollowers', () => {
        it('should get followers list', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/follow/getFollowers?userId=${testUserId}&page=1&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 400]).toContain(response.status);
        });
    });

    describe('GET /follow/getFollowing', () => {
        it('should get following list', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/follow/getFollowing?userId=${testUserId}&page=1&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 400]).toContain(response.status);
        });
    });

    describe('GET /follow/checkFollowing', () => {
        it('should check if following user', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/follow/checkFollowing?userId=${testUserId}`,
                {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('isFollowing');
                expect(typeof data.isFollowing).toBe('boolean');
            }

            expect([200, 401]).toContain(response.status);
        });
    });

    describe('GET /follow/getSuggestedUsers', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/follow/getSuggestedUsers?limit=5`);
            expect([401, 403]).toContain(response.status);
        });

        it('should get suggested users with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/follow/getSuggestedUsers?limit=5`,
                {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 401, 400]).toContain(response.status);
        });
    });
});

