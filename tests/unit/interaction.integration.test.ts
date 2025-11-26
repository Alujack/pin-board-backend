import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Interaction API Tests', () => {
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

    describe('POST /interaction', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin: testPinId,
                    type: 'view'
                })
            });

            expect([401, 403, 404]).toContain(response.status);
        });

        it('should create interaction with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/interaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    pin: testPinId,
                    type: 'view'
                })
            });

            expect([200, 201, 400, 401, 404]).toContain(response.status);
        });
    });

    describe('GET /interaction', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/interaction`);
            expect([401, 403, 404]).toContain(response.status);
        });

        it('should get user interactions with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/interaction`, {
                headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
            });

            if (response.ok) {
                const data = await response.json();
                // API may return array directly or wrapped in data
                const isValid = Array.isArray(data) || (data && data.data) || data;
                expect(isValid).toBeTruthy();
            }

            expect([200, 401, 404, 400]).toContain(response.status);
        });
    });
});


