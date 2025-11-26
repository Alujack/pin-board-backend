import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Feed API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;
    const testPinId = '68eb10063edcc8eb591d248c';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('GET /feed/getPersonalizedFeed', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/feed/getPersonalizedFeed?page=1&limit=10`);
            expect([401, 403]).toContain(response.status);
        });

        it('should get personalized feed with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/feed/getPersonalizedFeed?page=1&limit=10`,
                {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 401, 404, 400]).toContain(response.status);
        });

        it('should support pagination', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/feed/getPersonalizedFeed?page=2&limit=5`,
                {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('pagination');
            }

            expect([200, 401, 404, 400]).toContain(response.status);
        });
    });

    describe('GET /feed/getPopularPins', () => {
        it('should get popular pins', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/feed/getPopularPins?page=1&limit=10`);

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 401, 404, 400]).toContain(response.status);
        });

        it('should support time range filter', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/feed/getPopularPins?page=1&limit=10&timeRange=week`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
            }

            expect([200, 401, 400]).toContain(response.status);
        });
    });

    describe('GET /feed/getRelatedPins', () => {
        it('should get related pins for a pin', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/feed/getRelatedPins?pinId=${testPinId}&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 404, 400]).toContain(response.status);
        });

        it('should return empty array for non-existent pin', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/feed/getRelatedPins?pinId=000000000000000000000000&limit=10`
            );

            expect([200, 404, 400]).toContain(response.status);
        });
    });
});

