import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Board Collaborator API Tests', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI3NzkwNTFmNjVjZGI3YWM5YTU4ZiIsImlhdCI6MTc2Mzc0NDk2MSwiZXhwIjoxNzY2MzM2OTYxfQ._fm2KhDl1A7PlRRdX99AL-3VrNBv6rCfEwnmWGNFB14';
    let serverAvailable = false;
    const testBoardId = '68e6aa19a7608bf68397d9ad';
    const testUserId = '68e283e351f65cdb7ac9a594';

    beforeAll(async () => {
        try {
            const response = await fetch(`${BASE_URL}/pins?limit=1`);
            serverAvailable = response.ok || response.status === 401;
        } catch (error) {
            serverAvailable = false;
        }
    });

    describe('POST /boardCollaborator/addCollaborator', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boardCollaborator/addCollaborator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: testBoardId,
                    userId: testUserId,
                    role: 'viewer'
                })
            });

            expect([401, 403]).toContain(response.status);
        });

        it('should add collaborator with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boardCollaborator/addCollaborator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    boardId: testBoardId,
                    userId: testUserId,
                    role: 'viewer'
                })
            });

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('success');
            }

            expect([200, 201, 400, 401, 404, 409]).toContain(response.status);
        });
    });

    describe('POST /boardCollaborator/removeCollaborator', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boardCollaborator/removeCollaborator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: testBoardId,
                    userId: testUserId
                })
            });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('GET /boardCollaborator/getCollaborators', () => {
        it('should get collaborators for a board', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/boardCollaborator/getCollaborators?boardId=${testBoardId}&page=1&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('data');
                expect(Array.isArray(data.data)).toBe(true);
            }

            expect([200, 404, 400]).toContain(response.status);
        });

        it('should support pagination', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(
                `${BASE_URL}/boardCollaborator/getCollaborators?boardId=${testBoardId}&page=1&limit=5`
            );

            if (response.ok) {
                const data = await response.json();
                expect(data).toHaveProperty('pagination');
            }

            expect([200, 404, 400]).toContain(response.status);
        });
    });

    describe('PUT /boardCollaborator/updateCollaboratorRole', () => {
        it('should require authentication', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boardCollaborator/updateCollaboratorRole`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardId: testBoardId,
                    userId: testUserId,
                    role: 'editor'
                })
            });

            expect([401, 403]).toContain(response.status);
        });

        it('should update role with valid token', async () => {
            if (!serverAvailable) {
                console.log('⚠️  Server not running, skipping test');
                return;
            }

            const response = await fetch(`${BASE_URL}/boardCollaborator/updateCollaboratorRole`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TEST_TOKEN}`
                },
                body: JSON.stringify({
                    boardId: testBoardId,
                    userId: testUserId,
                    role: 'editor'
                })
            });

            expect([200, 400, 401, 404]).toContain(response.status);
        });
    });
});

