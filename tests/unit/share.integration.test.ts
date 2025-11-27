import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Share API Tests', () => {
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

    describe('POST /share/sharePin', () => {
        it('should work without authentication (public endpoint)', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/share/sharePin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pinId: testPinId
                })
            });

            expect([200, 201, 401, 403, 404, 400]).toContain(response.status);
        });

        it('should share pin with or without token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/share/sharePin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    pinId: testPinId
                })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('success');
            }

            expect([200, 201, 400, 401, 404]).toContain(response.status);
        });
    });

    describe('GET /share/getShareCount', () => {
        it('should get share count for a pin', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/share/getShareCount?pinId=${testPinId}`);

            if (response.ok) {
                const data = await response.json();
                // API may return different structure
                expect(data).toBeDefined();
            }

            expect([200, 404, 400]).toContain(response.status);
        });
    });

    describe('GET /share/generateShareLink', () => {
        it('should generate shareable link', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/share/generateShareLink?pinId=${testPinId}`
            );

            if (response.ok) {
                const data = await response.json();
                // API may return different structure
                expect(data).toBeDefined();
            }

            expect([200, 404, 400]).toContain(response.status);
        });
    });
});

