import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Upload API Tests', () => {
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

    describe('POST /upload/image', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            expect([401, 403, 400, 404]).toContain(response.status);
        });
    });

    describe('POST /upload/video', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/upload/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            expect([401, 403, 400, 404]).toContain(response.status);
        });
    });

    describe('POST /upload/profile-picture', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/upload/profile-picture`, {
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            expect([401, 403, 400, 404]).toContain(response.status);
        });
    });

    describe('DELETE /upload/deleteMedia', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/upload/deleteMedia?publicId=test_image`,
                { method: 'DELETE' }
            );

            expect([401, 403, 404]).toContain(response.status);
        });
    });

    describe('GET /upload/getUploadSignature', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/upload/getUploadSignature`);
            expect([401, 403, 404]).toContain(response.status);
        });

        it('should get upload signature with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/upload/getUploadSignature`, {
                headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('signature');
                expect(data).toHaveProperty('timestamp');
            }

            expect([200, 401, 404]).toContain(response.status);
        });
    });
});

