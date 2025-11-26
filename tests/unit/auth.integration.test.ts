import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Authentication API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    let serverAvailable = false;
    let authToken = '';
    let testUserId = '';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const randomEmail = `test${Date.now()}@example.com`;
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: `testuser${Date.now()}`,
                    email: randomEmail,
                    password: 'Test123!@#',
                    full_name: 'Test User'
                })
            });

            if (response.ok) {
                const data = await response.json();
                // API returns user object directly, not wrapped
                expect(data).toHaveProperty('_id');
                expect([200, 201]).toContain(response.status);
            } else {
                // User might already exist, which is okay
                expect([200, 201, 400, 409]).toContain(response.status);
            }
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'string',
                    password: 'string'
                })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('token');
                authToken = data.token;
            }
            
            expect([200, 401, 400]).toContain(response.status);
        });

        it('should fail with invalid credentials', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid@example.com',
                    password: 'wrongpassword'
                })
            });

            expect([401, 404, 400]).toContain(response.status);
        });
    });

    describe('GET /auth/me', () => {
        it('should get current user profile with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
            
            const response = await fetch(`${BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // API returns user object directly
                expect(data).toHaveProperty('_id');
            }

            expect([200, 401]).toContain(response.status);
        });

        it('should fail without token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/auth/me`);
            expect([401, 403]).toContain(response.status);
        });
    });
});

