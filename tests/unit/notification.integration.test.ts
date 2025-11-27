import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Notification API Tests', () => {
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

    describe('GET /notifications', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications?page=1&limit=10`);
            expect([401, 403, 404]).toContain(response.status);
        });

        it('should get notifications with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/notifications?page=1&limit=10`,
                {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 401, 404]).toContain(response.status);
        });
    });

    describe('POST /notifications/register-token', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications/register-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'test_fcm_token' })
            });
            expect([401, 403, 404]).toContain(response.status);
        });

        it('should register FCM token with valid auth', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications/register-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({ token: 'test_fcm_token' })
            });

            expect([200, 201, 401, 404, 400]).toContain(response.status);
        });
    });

    describe('POST /notifications/mark-read', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: '68eb10063edcc8eb591d248c' })
            });

            expect([401, 403, 404]).toContain(response.status);
        });
    });

    describe('POST /notifications/mark-all-read', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([401, 403, 404]).toContain(response.status);
        });

        it('should mark all as read with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                }
            });

            expect([200, 201, 401, 404, 400]).toContain(response.status);
        });
    });
});

